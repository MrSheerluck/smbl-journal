use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

use super::requests::{ConfirmPasswordResetRequest, PasswordResetRequest};
use super::{workos_client, workos_error};

pub async fn password_reset_request(Json(req): Json<PasswordResetRequest>) -> Response {
    let result = workos_client()
        .user_management()
        .reset_password(workos::user_management::ResetPasswordParams::new(
            workos::models::CreatePasswordResetToken { email: req.email },
        ))
        .await;

    if let Err(e) = result {
        tracing::error!("workos password reset request failed: {e}");
    }

    (StatusCode::OK, Json(json!({ "ok": true }))).into_response()
}

pub async fn password_reset_confirm(Json(req): Json<ConfirmPasswordResetRequest>) -> Response {
    let result = workos_client()
        .user_management()
        .confirm_password_reset(workos::user_management::ConfirmPasswordResetParams::new(
            workos::models::CreatePasswordReset {
                token: req.token.into(),
                new_password: req.new_password.into(),
            },
        ))
        .await;

    match result {
        Ok(_) => (StatusCode::OK, Json(json!({ "ok": true }))).into_response(),
        Err(e) => workos_error(&e),
    }
}
