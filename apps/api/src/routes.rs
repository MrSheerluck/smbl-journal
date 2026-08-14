use axum::{Json, extract::State, http::StatusCode};
use serde::Deserialize;
use serde_json::json;

use crate::state::AppState;

#[derive(Deserialize)]
pub struct WaitlistPayload {
    email: String,
}

fn is_valid_email(email: &str) -> bool {
    !email.is_empty() && email.contains('@') && email.contains('.')
}

pub async fn waitlist(
    State(state): State<AppState>,
    Json(payload): Json<WaitlistPayload>,
) -> (StatusCode, Json<serde_json::Value>) {
    let Some(conn) = state.connection() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "ok": false, "error": "waitlist is temporarily unavailable" })),
        );
    };

    let email = payload.email.trim().to_lowercase();
    if !is_valid_email(&email) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "ok": false, "error": "enter a valid email address" })),
        );
    }

    match conn
        .execute(
            "INSERT INTO waitlist (email) VALUES (?1) ON CONFLICT(email) DO NOTHING",
            libsql::params![email],
        )
        .await
    {
        Ok(_) => (StatusCode::OK, Json(json!({ "ok": true }))),
        Err(e) => {
            tracing::error!("failed to insert waitlist row: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "ok": false, "error": "something went wrong" })),
            )
        }
    }
}

pub async fn health(State(state): State<AppState>) -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "db": if state.conn.is_some() { "connected" } else { "unavailable" }
    }))
}
