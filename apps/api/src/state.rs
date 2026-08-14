use std::sync::Arc;

use libsql::{Connection, Database};

#[derive(Clone)]
pub struct AppState {
    pub conn: Option<Arc<Database>>,
}

impl AppState {
    pub fn connection(&self) -> Option<Connection> {
        let db = self.conn.as_ref()?;
        db.connect().ok()
    }
}
