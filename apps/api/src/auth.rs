use std::sync::OnceLock;
use std::time::{Duration, Instant};

use axum::{
    Json,
    extract::State,
    http::{HeaderMap, StatusCode, header::AUTHORIZATION},
    response::{IntoResponse, Response},
};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode, decode_header};
use serde::Deserialize;
use serde_json::json;
use tokio::sync::RwLock;

use crate::{db, state::AppState};

#[derive(Deserialize)]
pub struct ExchangeRequest {
    code: String,
}

#[derive(Deserialize)]
pub struct VaultPayload {
    wrapped: String,
    iv: String,
    salt: String,
    params: serde_json::Value,
}

#[derive(Deserialize)]
struct Claims {
    sub: String,
}

#[derive(Deserialize, Clone)]
struct Jwk {
    kid: String,
    n: String,
    e: String,
}

#[derive(Deserialize, Clone)]
struct Jwks {
    keys: Vec<Jwk>,
}

/// Cached WorkOS signing keys. Fetched lazily, re-fetched if stale.
static JWKS: OnceLock<RwLock<Option<(Jwks, Instant)>>> = OnceLock::new();

fn env(name: &str) -> String {
    std::env::var(name).expect(&format!("{name} not set"))
}

/// Verify the WorkOS session JWT and return its claims, or `None`.
async fn verify_access_token(token: &str) -> Option<Claims> {
    let kid = decode_header(token).ok()?.kid?;
    let jwks = fetch_jwks().await?;
    let key = jwks.keys.iter().find(|k| k.kid == kid)?;
    let dk = DecodingKey::from_rsa_components(&key.n, &key.e).ok()?;
    let data = decode::<Claims>(token, &dk, &Validation::new(Algorithm::RS256)).ok()?;
    Some(data.claims)
}

async fn fetch_jwks() -> Option<Jwks> {
    let slot = JWKS.get_or_init(|| RwLock::new(None));

    {
        let cached = slot.read().await;
        if let Some((jwks, at)) = cached.as_ref() {
            if at.elapsed() < Duration::from_secs(6 * 60 * 60) {
                return Some(jwks.clone());
            }
        }
    }

    let url = format!("https://api.workos.com/sso/jwks/{}", env("WORKOS_CLIENT_ID"));
    let jwks: Jwks = reqwest::get(&url).await.ok()?.json().await.ok()?;
    let mut w = slot.write().await;
    *w = Some((jwks.clone(), Instant::now()));
    Some(jwks)
}

/// Read the bearer token from an incoming request header.
async fn auth_user(headers: &HeaderMap) -> Option<Claims> {
    let bearer = headers.get(AUTHORIZATION)?.to_str().ok()?;
    let token = bearer.strip_prefix("Bearer ")?;
    verify_access_token(token).await
}

/// Exchange an authorization code for a WorkOS session.
/// Called server-to-server by the SvelteKit BFF; the API returns the session
/// token and user identity but never sets a cookie.
pub async fn exchange(
    State(state): State<AppState>,
    Json(req): Json<ExchangeRequest>,
) -> Response {
    let client = workos::Client::builder()
        .api_key(env("WORKOS_CLIENT_SECRET"))
        .client_id(env("WORKOS_CLIENT_ID"))
        .build();

    let result = client
        .user_management()
        .authenticate_with_code(workos::user_management::AuthenticateWithCodeParams::new(
            req.code,
        ))
        .await;

    let resp = match result {
        Ok(r) => r,
        Err(e) => {
            tracing::error!("workos auth failed: {e}");
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "authentication failed"})),
            )
                .into_response();
        }
    };

    let workos_id = resp.user.id.clone();
    let email = resp.user.email.clone();
    let access_token = resp.access_token.expose().to_string();

    if let Some(conn) = &state.conn {
        if let Err(e) = db::upsert_user(conn, &workos_id, &email).await {
            tracing::error!("failed to upsert user: {e}");
        }
    }

    let vault_setup = match &state.conn {
        Some(conn) => match db::get_user(conn, &workos_id).await {
            Some((_, setup)) => setup,
            None => false,
        },
        None => false,
    };

    Json(json!({
        "access_token": access_token,
        "workos_id": workos_id,
        "email": email,
        "vault_setup": vault_setup
    }))
    .into_response()
}

pub async fn me(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let Some(claims) = auth_user(&headers).await else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({"error": "no session"})),
        )
            .into_response();
    };

    let (email, vault_setup) = match &state.conn {
        Some(conn) => db::get_user(conn, &claims.sub).await.unwrap_or_default(),
        None => (String::new(), false),
    };

    Json(json!({
        "workos_id": claims.sub,
        "email": email,
        "vault_setup": vault_setup
    }))
    .into_response()
}

pub async fn save_vault(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<VaultPayload>,
) -> Response {
    let Some(claims) = auth_user(&headers).await else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({"error": "no session"})),
        )
            .into_response();
    };
    let Some(conn) = &state.conn else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error": "db unavailable"})),
        )
            .into_response();
    };

    match db::save_vault(
        conn,
        &claims.sub,
        &payload.wrapped,
        &payload.iv,
        &payload.salt,
        &payload.params.to_string(),
    )
    .await
    {
        Ok(_) => (StatusCode::OK, Json(json!({"ok": true}))).into_response(),
        Err(e) => {
            tracing::error!("failed to save vault: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "failed to save vault"})),
            )
                .into_response()
        }
    }
}
