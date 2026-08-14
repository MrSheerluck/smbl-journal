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

/// True if the `users` table does not have the `workos_id` column
/// (e.g. it was created with a different auth schema). The table is rebuilt.
async fn users_table_needs_migration(conn: &Connection) -> bool {
    let Ok(mut rows) = conn.query("PRAGMA table_info(users)", ()).await else {
        return true;
    };
    let mut has_workos_id = false;
    while let Ok(Some(row)) = rows.next().await {
        if row.get::<String>(1).ok().as_deref() == Some("workos_id") {
            has_workos_id = true;
        }
    }
    !has_workos_id
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

    if users_table_needs_migration(conn).await {
        tracing::warn!("migrating users table to WorkOS schema");
        if let Err(e) = conn.execute("DROP TABLE IF EXISTS users", ()).await {
            tracing::error!("failed to drop legacy users table: {e}");
        }
    }

    if let Err(e) = conn
        .execute(
            "CREATE TABLE IF NOT EXISTS users (
				workos_id TEXT PRIMARY KEY,
				email TEXT NOT NULL UNIQUE,
				kdf_salt TEXT,
				kdf_params TEXT,
				wrapped_vault_key TEXT,
				wrapped_key_iv TEXT,
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

/// Returns (email, vault_setup) for a user id.
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

pub async fn save_vault(
    conn: &Connection,
    workos_id: &str,
    wrapped: &str,
    iv: &str,
    salt: &str,
    params: &str,
) -> Result<(), libsql::Error> {
    conn.execute(
        "UPDATE users
           SET wrapped_vault_key = ?1, wrapped_key_iv = ?2, kdf_salt = ?3, kdf_params = ?4
           WHERE workos_id = ?5",
        libsql::params![wrapped, iv, salt, params, workos_id],
    )
    .await
    .map(|_| ())
}

pub async fn get_vault(
    conn: &Connection,
    workos_id: &str,
) -> Option<(String, String, String, String)> {
    let mut rows = conn
        .query(
            "SELECT wrapped_vault_key, wrapped_key_iv, kdf_salt, kdf_params FROM users WHERE workos_id = ?1",
            libsql::params![workos_id],
        )
        .await
        .ok()?;
    let row = rows.next().await.ok()??;
    Some((
        row.get::<String>(0).ok()?,
        row.get::<String>(1).ok()?,
        row.get::<String>(2).ok()?,
        row.get::<String>(3).ok()?,
    ))
}
