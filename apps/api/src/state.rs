use std::sync::Arc;

use libsql::Connection;

#[derive(Clone)]
pub struct AppState {
    pub conn: Option<Arc<Connection>>,
}
