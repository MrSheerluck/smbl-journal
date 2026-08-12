use axum::{
    Json,
    extract::State,
    http::{HeaderMap, StatusCode, header::AUTHORIZATION},
    response::{IntoResponse, Response},
};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode, decode_header};
use serde_json::json;

use crate::{db, state::AppState};

use super::fetch_jwks;
use super::requests::{Claims, RevokeSessionRequest, VaultPayload};
use super::workos_client;

/// Verify the WorkOS session JWT and return its claims, or `None`.
async fn verify_access_token(token: &str) -> Option<Claims> {
    let kid = decode_header(token).ok()?.kid?;
    let jwks = fetch_jwks().await?;
    let key = jwks.keys.iter().find(|k| k.kid == kid)?;
    let dk = DecodingKey::from_rsa_components(&key.n, &key.e).ok()?;
    let data = decode::<Claims>(token, &dk, &Validation::new(Algorithm::RS256)).ok()?;
    Some(data.claims)
}

/// Read the bearer token from an incoming request header.
async fn auth_user(headers: &HeaderMap) -> Option<Claims> {
    let bearer = headers.get(AUTHORIZATION)?.to_str().ok()?;
    let token = bearer.strip_prefix("Bearer ")?;
    verify_access_token(token).await
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

/// Revoke a WorkOS session server-side (used by logout). Idempotent: returns
/// success even if the session is already gone, so the BFF always clears the
/// cookie.
pub async fn logout(Json(req): Json<RevokeSessionRequest>) -> Response {
    let result = workos_client()
        .user_management()
        .revoke_session(workos::user_management::RevokeSessionParams::new(
            workos::models::RevokeSession {
                session_id: req.session_id,
            },
        ))
        .await;

    if let Err(e) = result {
        tracing::error!("workos session revoke failed: {e}");
    }

    (StatusCode::OK, Json(json!({ "ok": true }))).into_response()
}
