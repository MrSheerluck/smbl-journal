use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

use super::requests::{ConfirmPasswordResetRequest, PasswordResetRequest};
use super::{workos_client, workos_error};

/// Start a password reset. WorkOS issues a one-time token and delivers the
/// reset email to the account owner. The token is never returned to the
/// caller/browser (that would let anyone reset someone else's password). We
/// always return ok so we don't leak whether an account exists.
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

/// Complete a password reset with the one-time token and a new password. Also
/// verifies the user's email if it hadn't been verified.
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
