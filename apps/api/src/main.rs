use std::sync::Arc;

use axum::{
    Json, Router,
    extract::State,
    http::StatusCode,
    routing::{get, post},
};
use libsql::{Connection, Database};
use serde::Deserialize;
use serde_json::json;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

#[derive(Clone)]
struct AppState {
    conn: Option<Arc<Connection>>,
}

#[derive(Deserialize)]
struct WaitlistPayload {
    email: String,
}

#[tokio::main]
async fn main() {
    load_env();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "api=debug,tower_http=debug".into()),
        )
        .init();

    let db = connect_db().await;
    let conn = match db {
        Some(db) => match db.connect() {
            Ok(conn) => Some(Arc::new(conn)),
            Err(e) => {
                tracing::error!("failed to open connection: {e}");
                None
            }
        },
        None => None,
    };

    if let Some(conn) = &conn {
        tracing::info!("connected to Turso");
        init_schema(conn).await;
    } else {
        tracing::warn!("DATABASE_URL not set — running without database");
    }

    let state = AppState { conn };

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/waitlist", post(waitlist))
        .with_state(state)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], 8080));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind");

    tracing::info!("listening on {addr}");
    axum::serve(listener, app).await.expect("server error");
}

fn load_env() {
    for path in [".env", "apps/api/.env"] {
        if std::path::Path::new(path).exists() {
            if let Err(e) = dotenvy::from_path(path) {
                tracing::warn!("failed to load {path}: {e}");
            }
            return;
        }
    }
}

async fn connect_db() -> Option<Database> {
    let url = std::env::var("DATABASE_URL").ok()?;
    let token = std::env::var("TURSO_AUTH_TOKEN").unwrap_or_default();
    match libsql::Builder::new_remote(url, token).build().await {
        Ok(db) => Some(db),
        Err(e) => {
            tracing::error!("failed to connect to database: {e}");
            None
        }
    }
}

async fn init_schema(conn: &Connection) {
    if let Err(e) = conn
        .execute(
            "CREATE TABLE IF NOT EXISTS waitlist (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				email TEXT NOT NULL UNIQUE,
				created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
			)",
            (),
        )
        .await
    {
        tracing::error!("failed to init waitlist table: {e}");
    }
}

fn is_valid_email(email: &str) -> bool {
    !email.is_empty() && email.contains('@') && email.contains('.')
}

async fn waitlist(
    State(state): State<AppState>,
    Json(payload): Json<WaitlistPayload>,
) -> (StatusCode, Json<serde_json::Value>) {
    let Some(conn) = &state.conn else {
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

async fn health(State(state): State<AppState>) -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "db": if state.conn.is_some() { "connected" } else { "unavailable" }
    }))
}
