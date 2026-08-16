use serde::Deserialize;

#[derive(Deserialize)]
pub struct PasswordRequest {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct SignupRequest {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct VerifyEmailRequest {
    pub code: String,
    pub pending_authentication_token: String,
}

#[derive(Deserialize)]
pub struct RevokeSessionRequest {
    pub session_id: String,
}

#[derive(Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Deserialize)]
pub struct PasswordResetRequest {
    pub email: String,
}

#[derive(Deserialize)]
pub struct ConfirmPasswordResetRequest {
    pub token: String,
    pub new_password: String,
}

#[derive(Deserialize)]
pub struct VaultPayload {
    pub wrapped: String,
    pub iv: String,
    pub salt: String,
    pub params: serde_json::Value,
}

#[derive(Deserialize)]
pub struct Claims {
    pub sub: String,
}

#[derive(Deserialize, Clone)]
pub struct Jwk {
    pub kid: String,
    pub n: String,
    pub e: String,
}

#[derive(Deserialize, Clone)]
pub struct Jwks {
    pub keys: Vec<Jwk>,
}
