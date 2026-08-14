mod auth;
mod db;
mod entries;
mod routes;
mod state;

use axum::{
    Router,
    http::{Method, header::HeaderValue},
    routing::{get, post},
};
use state::AppState;
use tower_http::cors::{AllowOrigin, Any, CorsLayer};
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    load_env();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "api=debug,tower_http=debug".into()),
        )
        .init();

    let conn = db::connect().await;
    if let Some(conn) = &conn {
        tracing::info!("connected to Turso");
        db::init_schema(conn).await;
    } else {
        tracing::warn!("DATABASE_URL not set — running without database");
    }

    let app = Router::new()
        .route("/health", get(routes::health))
        .route("/api/waitlist", post(routes::waitlist))
        .merge(auth::routes())
        .merge(entries::routes())
        .with_state(AppState { conn })
        .layer(cors_layer())
        .layer(TraceLayer::new_for_http());

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);
    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));
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

fn cors_layer() -> CorsLayer {
    let origins: Vec<HeaderValue> = std::env::var("CORS_ORIGINS")
        .map(|s| s.split(',').filter_map(|o| o.trim().parse().ok()).collect())
        .unwrap_or_else(|_| vec![HeaderValue::from_static("http://localhost:5173")]);
    tracing::info!("cors origins: {origins:?}");
    CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any)
}
