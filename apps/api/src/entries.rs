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
    pub start: Option<String>,
    pub end: Option<String>,
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
    if query.start.is_some() || query.end.is_some() {
        let start = query.start.unwrap_or_default();
        let end = query.end.unwrap_or_default();
        let Some(conn) = &state.conn else {
            return unavailable();
        };
        match db::list_entries_range(conn, &claims.sub, &start, &end).await {
            Some(entries) => Json(
                entries
                    .into_iter()
                    .map(
                        |(id, entry_date, body_ciphertext, body_iv)| json!({
                            "id": id,
                            "entry_date": entry_date,
                            "body_ciphertext": body_ciphertext,
                            "body_iv": body_iv,
                        }),
                    )
                    .collect::<Vec<_>>(),
            )
            .into_response(),
            None => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "failed to list entries"})),
            )
                .into_response(),
        }
    } else if let Some(date) = query.date {
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
    } else {
        list_entries(State(state), headers).await
    }
}

pub async fn list_entries(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Response {
    let Some(claims) = auth_user(&headers).await else {
        return unauthorized();
    };
    let Some(conn) = &state.conn else {
        return unavailable();
    };

    match db::list_entry_dates(conn, &claims.sub).await {
        Some(dates) => Json(
            dates
                .into_iter()
                .map(|(id, entry_date)| json!({ "id": id, "entry_date": entry_date }))
                .collect::<Vec<_>>(),
        )
        .into_response(),
        None => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "failed to list entries"})),
        )
            .into_response(),
    }
}

pub async fn delete_entry(
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

    match db::delete_entry(conn, &claims.sub, &date).await {
        Ok(true) => Json(json!({"ok": true})).into_response(),
        Ok(false) => (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "no entry"})),
        )
            .into_response(),
        Err(e) => {
            tracing::error!("failed to delete entry: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "failed to delete entry"})),
            )
                .into_response()
        }
    }
}

pub fn routes() -> axum::Router<AppState> {
    use axum::routing::post;
    axum::Router::new().route(
        "/entries",
        post(save_entry).get(get_entry).delete(delete_entry),
    )
}
