use axum::{
    Json,
    extract::{Query, State},
    http::{
        HeaderMap, HeaderValue, StatusCode,
        header::{COOKIE, SET_COOKIE},
    },
    response::{IntoResponse, Redirect, Response},
};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode, decode_header};
use rand::{Rng, distributions::Alphanumeric};
use serde::Deserialize;
use serde_json::json;

use crate::{db, state::AppState};

const SESSION_COOKIE: &str = "smbl.session";
const STATE_COOKIE: &str = "smbl.state";

#[derive(Deserialize)]
pub struct CallbackQuery {
    code: String,
    state: String,
}

#[derive(Deserialize)]
struct Claims {
    sub: String,
}

#[derive(Deserialize)]
struct Jwk {
    kid: String,
    n: String,
    e: String,
}

#[derive(Deserialize)]
struct Jwks {
    keys: Vec<Jwk>,
}

fn env(name: &str) -> String {
    std::env::var(name).expect(&format!("{name} not set"))
}

fn nonce() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(24)
        .map(char::from)
        .collect()
}

fn cookie_value(cookies: &str, name: &str) -> Option<String> {
    cookies.split(';').find_map(|c| {
        let c = c.trim();
        let (k, v) = c.split_once('=')?;
        (k == name).then(|| v.to_string())
    })
}

fn session_cookie(token: &str, max_age: i64) -> HeaderValue {
    HeaderValue::from_str(&format!(
        "{SESSION_COOKIE}={token}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age={max_age}"
    ))
    .unwrap()
}

pub async fn login() -> Response {
    let state = nonce();
    let url = format!(
        "https://api.workos.com/user_management/authorize?response_type=code&client_id={}&redirect_uri={}&provider=authkit&state={}",
        env("WORKOS_CLIENT_ID"),
        env("WORKOS_REDIRECT_URI"),
        state
    );
    let state_cookie = HeaderValue::from_str(&format!(
        "{STATE_COOKIE}={state}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600"
    ))
    .unwrap();
    let mut resp = Redirect::to(&url).into_response();
    resp.headers_mut().insert(SET_COOKIE, state_cookie);
    resp
}

pub async fn callback(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(q): Query<CallbackQuery>,
) -> Response {
    let valid_state = headers
        .get(COOKIE)
        .and_then(|v| v.to_str().ok())
        .and_then(|c| cookie_value(c, STATE_COOKIE))
        .map(|s| s == q.state)
        .unwrap_or(false);

    if !valid_state {
        tracing::warn!("state mismatch — possible CSRF");
        return Redirect::to("/login").into_response();
    }

    let client = workos::Client::builder()
        .api_key(env("WORKOS_CLIENT_SECRET"))
        .client_id(env("WORKOS_CLIENT_ID"))
        .build();

    let result = client
        .user_management()
        .authenticate_with_code(workos::user_management::AuthenticateWithCodeParams::new(
            q.code,
        ))
        .await;

    let resp = match result {
        Ok(r) => r,
        Err(e) => {
            tracing::error!("workos auth failed: {e}");
            return Redirect::to("/login").into_response();
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

    let target = if vault_setup { "/home" } else { "/setup" };
    let mut resp = Redirect::to(target).into_response();
    resp.headers_mut()
        .insert(SET_COOKIE, session_cookie(&access_token, 3600));
    resp
}

pub async fn me(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let Some(cookie) = headers.get(COOKIE).and_then(|v| v.to_str().ok()) else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({"error": "no session"})),
        )
            .into_response();
    };
    let Some(token) = cookie_value(cookie, SESSION_COOKIE) else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({"error": "no session"})),
        )
            .into_response();
    };

    let Some(claims) = verify_access_token(&token).await else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({"error": "invalid session"})),
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

pub async fn logout() -> Response {
    let clear = HeaderValue::from_str(&format!(
        "{SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
    ))
    .unwrap();
    let mut resp = Redirect::to("/").into_response();
    resp.headers_mut().insert(SET_COOKIE, clear);
    resp
}

async fn verify_access_token(token: &str) -> Option<Claims> {
    let jwks_url = format!(
        "https://api.workos.com/sso/jwks/{}",
        env("WORKOS_CLIENT_ID")
    );
    let jwks: Jwks = reqwest::get(&jwks_url).await.ok()?.json().await.ok()?;
    let kid = decode_header(token).ok()?.kid?;
    let key = jwks.keys.iter().find(|k| k.kid == kid)?;
    let dk = DecodingKey::from_rsa_components(&key.n, &key.e).ok()?;
    let data = decode::<Claims>(token, &dk, &Validation::new(Algorithm::RS256)).ok()?;
    Some(data.claims)
}
