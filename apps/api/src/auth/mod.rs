mod password;
mod password_reset;
mod requests;
mod session;
mod signup;

use std::sync::OnceLock;
use std::time::{Duration, Instant};

use axum::{
    Json, Router,
    response::{IntoResponse, Response},
    routing::{get, post},
};
use serde_json::json;
use tokio::sync::RwLock;

use crate::{db, state::AppState};

use password::password;
use password_reset::{password_reset_confirm, password_reset_request};
use requests::Jwks;
pub(crate) use session::auth_user;
use session::{get_vault, logout, me, save_vault};

use signup::{signup, verify_email};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/auth/password", post(password))
        .route("/auth/signup", post(signup))
        .route("/auth/verify", post(verify_email))
        .route("/auth/logout", post(logout))
        .route("/auth/password-reset/request", post(password_reset_request))
        .route("/auth/password-reset/confirm", post(password_reset_confirm))
        .route("/auth/me", get(me))
        .route("/auth/me/vault", get(get_vault).put(save_vault))
}

fn env(name: &str) -> String {
    std::env::var(name).expect(&format!("{name} not set"))
}

fn workos_client() -> workos::Client {
    workos::Client::builder()
        .api_key(env("WORKOS_CLIENT_SECRET"))
        .client_id(env("WORKOS_CLIENT_ID"))
        .build()
}

async fn session_response(
    state: &AppState,
    resp: &workos::models::AuthenticateResponse,
) -> Response {
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

fn workos_error(err: &workos::Error) -> Response {
    tracing::error!("workos auth failed: {err}");
    let code = err.code().unwrap_or("authentication failed").to_string();
    let message = err
        .api()
        .map(|e| e.message.clone())
        .unwrap_or_else(|| err.to_string());
    (
        axum::http::StatusCode::UNAUTHORIZED,
        Json(json!({ "error": code, "message": message })),
    )
        .into_response()
}

fn pending_token_from_error(err: &workos::Error) -> Option<String> {
    let body = err.api()?.raw_body.clone();
    let value: serde_json::Value = serde_json::from_slice(&body).ok()?;
    value
        .get("pending_authentication_token")?
        .as_str()
        .map(|s| s.to_string())
}

static JWKS: OnceLock<RwLock<Option<(Jwks, Instant)>>> = OnceLock::new();

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

    let url = format!(
        "https://api.workos.com/sso/jwks/{}",
        env("WORKOS_CLIENT_ID")
    );
    let jwks: Jwks = reqwest::get(&url).await.ok()?.json().await.ok()?;
    let mut w = slot.write().await;
    *w = Some((jwks.clone(), Instant::now()));
    Some(jwks)
}
