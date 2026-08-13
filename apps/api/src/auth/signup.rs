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

pub async fn signup(State(_state): State<AppState>, Json(req): Json<SignupRequest>) -> Response {
    let client = workos_client();
    let um = client.user_management();

    let mut body = workos::user_management::CreateUserParamsBody::new(req.email.clone());
    body.password = Some(workos::user_management::Password::Plaintext {
        password: req.password.clone(),
    });

    if let Err(e) = um
        .create_user(workos::user_management::CreateUserParams::new(body))
        .await
    {
        return workos_error(&e);
    }

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
