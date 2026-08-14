use axum::{
    Json,
    extract::{Query, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use serde::Deserialize;
use serde_json::json;

use crate::{auth::auth_user, db, state::AppState};

#[derive(Deserialize)]
pub struct SaveEntryRequest {
    pub id: String,
    pub entry_date: String,
    pub body_ciphertext: String,
    pub body_iv: String,
}

#[derive(Deserialize)]
pub struct EntryQuery {
    pub date: Option<String>,
}

fn unauthorized() -> Response {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({"error": "no session"})),
    )
        .into_response()
}

fn unavailable() -> Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({"error": "db unavailable"})),
    )
        .into_response()
}

pub async fn save_entry(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<SaveEntryRequest>,
) -> Response {
    let Some(claims) = auth_user(&headers).await else {
        return unauthorized();
    };
    let Some(conn) = &state.conn else {
        return unavailable();
    };

    match db::save_entry(
        conn,
        &claims.sub,
        &payload.id,
        &payload.entry_date,
        &payload.body_ciphertext,
        &payload.body_iv,
    )
    .await
    {
        Ok(_) => Json(json!({"ok": true})).into_response(),
        Err(e) => {
            tracing::error!("failed to save entry: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "failed to save entry"})),
            )
                .into_response()
        }
    }
}

pub async fn get_entry(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<EntryQuery>,
) -> Response {
    let Some(claims) = auth_user(&headers).await else {
        return unauthorized();
    };
    let Some(date) = query.date else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "missing date"})),
        )
            .into_response();
    };
    let Some(conn) = &state.conn else {
        return unavailable();
    };

    match db::get_entry(conn, &claims.sub, &date).await {
        Some((id, entry_date, body_ciphertext, body_iv)) => Json(json!({
            "id": id,
            "entry_date": entry_date,
            "body_ciphertext": body_ciphertext,
            "body_iv": body_iv,
        }))
        .into_response(),
        None => (StatusCode::NOT_FOUND, Json(json!({"error": "no entry"}))).into_response(),
    }
}

pub fn routes() -> axum::Router<AppState> {
    use axum::routing::post;
    axum::Router::new().route("/entries", post(save_entry).get(get_entry))
}
