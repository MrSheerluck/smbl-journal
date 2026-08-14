use std::sync::Arc;

use libsql::Connection;

use crate::migrations;

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
    migrations::run(conn).await;
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

pub async fn save_entry(
    conn: &Connection,
    user_id: &str,
    id: &str,
    entry_date: &str,
    body_ciphertext: &str,
    body_iv: &str,
) -> Result<(), libsql::Error> {
    conn.execute(
        "INSERT INTO entries (id, user_id, entry_date, body_ciphertext, body_iv)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(user_id, entry_date) DO UPDATE SET
             body_ciphertext = excluded.body_ciphertext,
             body_iv = excluded.body_iv,
             updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')",
        libsql::params![id, user_id, entry_date, body_ciphertext, body_iv],
    )
    .await
    .map(|_| ())
}

pub async fn get_entry(
    conn: &Connection,
    user_id: &str,
    entry_date: &str,
) -> Option<(String, String, String, String)> {
    let mut rows = conn
        .query(
            "SELECT id, entry_date, body_ciphertext, body_iv FROM entries WHERE user_id = ?1 AND entry_date = ?2",
            libsql::params![user_id, entry_date],
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

pub async fn list_entries_range(
    conn: &Connection,
    user_id: &str,
    start: &str,
    end: &str,
) -> Option<Vec<(String, String, String, String)>> {
    let mut rows = conn
        .query(
            "SELECT id, entry_date, body_ciphertext, body_iv
             FROM entries
             WHERE user_id = ?1 AND entry_date BETWEEN ?2 AND ?3
             ORDER BY entry_date ASC",
            libsql::params![user_id, start, end],
        )
        .await
        .ok()?;
    let mut entries = Vec::new();
    while let Ok(Some(row)) = rows.next().await {
        entries.push((
            row.get::<String>(0).ok()?,
            row.get::<String>(1).ok()?,
            row.get::<String>(2).ok()?,
            row.get::<String>(3).ok()?,
        ));
    }
    Some(entries)
}

pub async fn list_entry_dates(conn: &Connection, user_id: &str) -> Option<Vec<(String, String)>> {
    let mut rows = conn
        .query(
            "SELECT id, entry_date FROM entries WHERE user_id = ?1 ORDER BY entry_date DESC",
            libsql::params![user_id],
        )
        .await
        .ok()?;
    let mut dates = Vec::new();
    while let Ok(Some(row)) = rows.next().await {
        let id = row.get::<String>(0).ok()?;
        let date = row.get::<String>(1).ok()?;
        dates.push((id, date));
    }
    Some(dates)
}

pub async fn delete_entry(
    conn: &Connection,
    user_id: &str,
    entry_date: &str,
) -> Result<bool, libsql::Error> {
    let res = conn
        .execute(
            "DELETE FROM entries WHERE user_id = ?1 AND entry_date = ?2",
            libsql::params![user_id, entry_date],
        )
        .await?;
    Ok(res > 0)
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

pub async fn reset_user(
    conn: &Connection,
    workos_id: &str,
) -> Result<(), libsql::Error> {
    conn.execute(
        "UPDATE users
            SET wrapped_vault_key = NULL, wrapped_key_iv = NULL, kdf_salt = NULL, kdf_params = NULL
          WHERE workos_id = ?1",
        libsql::params![workos_id],
    )
    .await?;
    conn.execute(
        "DELETE FROM entries WHERE user_id = ?1",
        libsql::params![workos_id],
    )
    .await?;
    Ok(())
}
