use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

use crate::state::AppState;

use super::requests::{SignupRequest, VerifyEmailRequest};
use super::{pending_token_from_error, session_response, workos_client, workos_error};

/// Embedded signup. Creates the user (unverified), triggers the email
/// verification one-time code, and returns a `pending_authentication_token`
/// that the BFF stores until the user submits their code at `/verify-email`.
pub async fn signup(State(_state): State<AppState>, Json(req): Json<SignupRequest>) -> Response {
    let client = workos_client();
    let um = client.user_management();

    let mut body = workos::user_management::CreateUserParamsBody::new(req.email.clone());
    body.password = Some(workos::user_management::Password::Plaintext {
        password: req.password.clone(),
    });

    let user = match um
        .create_user(workos::user_management::CreateUserParams::new(body))
        .await
    {
        Ok(u) => u,
        Err(e) => return workos_error(&e),
    };

    // Authenticating an unverified user yields the email-verification-required
    // error carrying the pending token (and triggers the one-time code email
    // when WorkOS's email verification email setting is enabled).
    let pending_token = match um
        .authenticate_with_password(workos::user_management::AuthenticateWithPasswordParams::new(
            req.email,
            req.password,
        ))
        .await
    {
        Ok(_) => None,
        Err(e) => pending_token_from_error(&e),
    };

    // Guarantee delivery of the verification code regardless of the email
    // setting (idempotent — WorkOS won't resend if one was already sent).
    if let Err(e) = um.send_verification_email(&user.id).await {
        tracing::error!("failed to send verification email: {e}");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "verification_email_failed", "message": "account created but we couldn't send the verification email" })),
        )
            .into_response();
    }

    match pending_token {
        Some(token) => {
            (StatusCode::OK, Json(json!({ "ok": true, "pending_authentication_token": token })))
                .into_response()
        }
        None => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "verification_pending_failed", "message": "couldn't start email verification" })),
        )
            .into_response(),
    }
}

/// Complete a signup by exchanging the emailed verification `code` for a
/// session (via the `pending_authentication_token` that WorkOS redirects to
/// our `/verify-email` page with).
pub async fn verify_email(
    State(state): State<AppState>,
    Json(req): Json<VerifyEmailRequest>,
) -> Response {
    let result = workos_client()
        .user_management()
        .authenticate_with_email_verification(
            workos::user_management::AuthenticateWithEmailVerificationParams::new(
                req.code,
                req.pending_authentication_token,
            ),
        )
        .await;

    match result {
        Ok(r) => session_response(&state, &r).await,
        Err(e) => workos_error(&e),
    }
}
