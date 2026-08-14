use std::collections::HashSet;

use libsql::{Connection, params};

struct Migration {
    version: &'static str,
    name: &'static str,
    sql: &'static str,
}

const MIGRATIONS: &[Migration] = &[Migration {
    version: "1",
    name: "0001_initial",
    sql: include_str!("../migrations/0001_initial.sql"),
}];

pub async fn run(conn: &Connection) {
    if let Err(e) = conn
        .execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations (
				version TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
			)",
            (),
        )
        .await
    {
        tracing::error!("failed to init schema_migrations table: {e}");
        return;
    }

    let applied = applied_versions(conn).await;

    for m in MIGRATIONS {
        if applied.contains(m.version) {
            continue;
        }
        apply(conn, m).await;
    }
}

async fn applied_versions(conn: &Connection) -> HashSet<String> {
    let mut versions = HashSet::new();
    let Ok(mut rows) = conn.query("SELECT version FROM schema_migrations", ()).await else {
        return versions;
    };
    while let Ok(Some(row)) = rows.next().await {
        if let Ok(v) = row.get::<String>(0) {
            versions.insert(v);
        }
    }
    versions
}

async fn apply(conn: &Connection, m: &Migration) {
    let tx = match conn.transaction().await {
        Ok(tx) => tx,
        Err(e) => {
            tracing::error!("failed to start migration {}: {e}", m.name);
            return;
        }
    };

    if let Err(e) = tx.execute_batch(m.sql).await {
        tracing::error!("migration {} failed, rolled back: {e}", m.name);
        return;
    }

    if let Err(e) = tx
        .execute(
            "INSERT INTO schema_migrations (version, name) VALUES (?1, ?2)",
            params![m.version, m.name],
        )
        .await
    {
        tracing::error!("failed to record migration {}: {e}", m.name);
        return;
    }

    if let Err(e) = tx.commit().await {
        tracing::error!("failed to commit migration {}: {e}", m.name);
        return;
    }

    tracing::info!("applied migration {}", m.name);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn runs_once_and_is_idempotent() {
        let dir = std::env::temp_dir().join(format!("mig_test_{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let db = libsql::Builder::new_local(dir.join("test.db"))
            .build()
            .await
            .unwrap();
        let conn = db.connect().unwrap();

        run(&conn).await;
        run(&conn).await;

        let mut rows = conn
            .query("SELECT version, name FROM schema_migrations ORDER BY version", ())
            .await
            .unwrap();
        let mut count = 0;
        while let Ok(Some(row)) = rows.next().await {
            let version: String = row.get(0).unwrap();
            let name: String = row.get(1).unwrap();
            assert_eq!(version, "1");
            assert_eq!(name, "0001_initial");
            count += 1;
        }
        assert_eq!(count, 1);

        let mut tables: Vec<String> = Vec::new();
        let mut rows = conn
            .query(
                "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
                (),
            )
            .await
            .unwrap();
        while let Ok(Some(row)) = rows.next().await {
            tables.push(row.get(0).unwrap());
        }
        for t in ["entries", "schema_migrations", "users", "waitlist"] {
            assert!(tables.contains(&t.to_string()), "missing table {t}: {tables:?}");
        }

        let _ = std::fs::remove_dir_all(&dir);
    }
}
