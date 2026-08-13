use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

use crate::state::AppState;

use super::requests::PasswordRequest;
use super::{pending_token_from_error, session_response, workos_client, workos_error};

pub async fn password(State(state): State<AppState>, Json(req): Json<PasswordRequest>) -> Response {
    let result = workos_client()
        .user_management()
        .authenticate_with_password(
            workos::user_management::AuthenticateWithPasswordParams::new(
                req.email.clone(),
                req.password,
            ),
        )
        .await;

    match result {
        Ok(r) => session_response(&state, &r).await,
        Err(e) if e.code() == Some("email_verification_required") => {
            match pending_token_from_error(&e) {
                Some(token) => (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({
                        "error": "email_verification_required",
                        "email": req.email,
                        "pending_authentication_token": token
                    })),
                )
                    .into_response(),
                None => workos_error(&e),
            }
        }
        Err(e) => workos_error(&e),
    }
}
