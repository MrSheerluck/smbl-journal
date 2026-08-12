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

pub async fn upsert_user(
    conn: &Connection,
    workos_id: &str,
    email: &str,
) -> Result<(), libsql::Error> {
    conn.execute(
        "INSERT INTO users (workos_id, email) VALUES (?1, ?2) ON CONFLICT(workos_id) DO UPDATE SET email = excluded.email",
        libsql::params![workos_id, email],
    )
    .await
    .map(|_| ())
}

pub async fn get_user(conn: &Connection, workos_id: &str) -> Option<(String, bool)> {
    let mut rows = conn
        .query(
            "SELECT email, wrapped_vault_key IS NOT NULL FROM users WHERE workos_id = ?1",
            libsql::params![workos_id],
        )
        .await
        .ok()?;
    let row = rows.next().await.ok()??;
    Some((row.get::<String>(0).ok()?, row.get::<i64>(1).ok()? == 1))
}
