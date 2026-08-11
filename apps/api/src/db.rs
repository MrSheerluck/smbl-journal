use std::sync::Arc;

use libsql::Connection;

pub async fn connect() -> Option<Arc<Connection>> {
    let url = std::env::var("DATABASE_URL").ok()?;
    let token = std::env::var("TURSO_AUTH_TOKEN").unwrap_or_default();
    let db = match libsql::Builder::new_remote(url, token).build().await {
        Ok(db) => db,
        Err(e) => {
            tracing::error!("failed to connect to database: {e}");
            return None;
        }
    };
    match db.connect() {
        Ok(conn) => Some(Arc::new(conn)),
        Err(e) => {
            tracing::error!("failed to open connection: {e}");
            None
        }
    }
}

pub async fn init_schema(conn: &Connection) {
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

    if let Err(e) = conn
        .execute(
            "CREATE TABLE IF NOT EXISTS users (
        workos_id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        kdf_salt TEXT,
        kdf_params TEXT,
        wrapped_vault_key TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        )",
            (),
        )
        .await
    {
        tracing::error!("failed to init users table: {e}");
    }
}
