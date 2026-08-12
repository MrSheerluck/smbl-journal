import { env } from '$env/dynamic/private';
import { postJson, type ApiError } from './rust';

export const SESSION_COOKIE = 'smbl.session';
export const PENDING_COOKIE = 'smbl.pending';

export interface Session {
	workos_id: string;
	email: string;
	vault_setup: boolean;
}

export interface SessionResult extends Session {
	access_token: string;
}

export interface SignupResult {
	ok: true;
	pending_authentication_token: string;
}

export function secureCookies(): boolean {
	return env.SECURE_COOKIES === 'true';
}

export function setSessionCookie(
	cookies: import('@sveltejs/kit').Cookies,
	result: SessionResult
) {
	cookies.set(SESSION_COOKIE, result.access_token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: secureCookies(),
		path: '/',
		maxAge: 3600
	});
}

export function setPendingCookie(cookies: import('@sveltejs/kit').Cookies, token: string) {
	cookies.set(PENDING_COOKIE, token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: secureCookies(),
		path: '/',
		maxAge: 600
	});
}

export async function loginWithPassword(
	email: string,
	password: string
): Promise<SessionResult | ApiError> {
	return postJson('/auth/password', { email, password });
}

export async function signup(
	email: string,
	password: string
): Promise<SignupResult | ApiError> {
	return postJson('/auth/signup', { email, password });
}

export async function verifyEmail(
	code: string,
	pendingAuthenticationToken: string
): Promise<SessionResult | ApiError> {
	return postJson('/auth/verify', {
		code,
		pending_authentication_token: pendingAuthenticationToken
	});
}

export async function revokeSession(sessionId: string): Promise<void> {
	try {
		await postJson('/auth/logout', { session_id: sessionId });
	} catch {
		// Best-effort: the BFF always clears the cookie regardless.
	}
}

export async function requestPasswordReset(
	email: string
): Promise<{ ok: true } | ApiError> {
	return postJson('/auth/password-reset/request', { email });
}

export async function confirmPasswordReset(
	token: string,
	newPassword: string
): Promise<{ ok: true } | ApiError> {
	return postJson('/auth/password-reset/confirm', { token, new_password: newPassword });
}
