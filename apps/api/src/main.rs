use std::sync::Arc;

use axum::{
	extract::State,
	routing::get,
	Router,
};
use libsql::Database;
use serde_json::json;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

#[derive(Clone)]
struct AppState {
	db: Option<Arc<Database>>,
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
	if db.is_some() {
		tracing::info!("connected to Turso");
	} else {
		tracing::warn!("DATABASE_URL not set — running without database");
	}

	let state = AppState {
		db: db.map(Arc::new),
	};

	let app = Router::new()
		.route("/health", get(health))
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

async fn health(State(state): State<AppState>) -> axum::Json<serde_json::Value> {
	axum::Json(json!({
		"status": "ok",
		"db": if state.db.is_some() { "connected" } else { "unavailable" }
	}))
}
