import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { REFRESH_COOKIE, SESSION_COOKIE, secureCookies, type SessionResult } from './auth';

export const RUST_ORIGIN = env.API_URL || 'http://localhost:8080';

export interface ApiError {
	error: string;
	message: string;
}

interface RequestOptions {
	method?: string;
	body?: unknown;
	token?: string;
	cookies?: Cookies;
}

const DEFAULT_ERROR: ApiError = {
	error: 'request_failed',
	message: 'The request failed. Please try again.'
};

async function tryRefresh(cookies: Cookies): Promise<string | null> {
	const refreshToken = cookies.get(REFRESH_COOKIE);
	if (!refreshToken) return null;
	try {
		const res = await fetch(`${RUST_ORIGIN}/auth/refresh`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ refresh_token: refreshToken })
		});
		if (!res.ok) return null;
		const data = (await res.json()) as Partial<SessionResult>;
		if (!data.access_token) return null;
		cookies.set(SESSION_COOKIE, data.access_token, {
			httpOnly: true,
			sameSite: 'lax',
			secure: secureCookies(),
			path: '/',
			maxAge: 3600
		});
		if (data.refresh_token) {
			cookies.set(REFRESH_COOKIE, data.refresh_token, {
				httpOnly: true,
				sameSite: 'lax',
				secure: secureCookies(),
				path: '/',
				maxAge: 604800
			});
		}
		return data.access_token;
	} catch {
		return null;
	}
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T | ApiError> {
	// Refresh only applies to requests that were already authenticated.
	const hadToken = !!opts.token;
	let token = opts.token;

	for (let attempt = 0; ; attempt++) {
		const headers: Record<string, string> = { 'content-type': 'application/json' };
		if (token) headers.authorization = `Bearer ${token}`;

		try {
			const res = await fetch(`${RUST_ORIGIN}${path}`, {
				method: opts.method ?? 'GET',
				headers,
				body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
			});
			const data = await res.json().catch(() => null);

			if (res.status === 401 && hadToken && attempt === 0 && opts.cookies) {
				const refreshed = await tryRefresh(opts.cookies);
				if (refreshed) {
					token = refreshed;
					continue;
				}
				return (data ?? DEFAULT_ERROR) as ApiError;
			}
			if (!res.ok) {
				return (data ?? DEFAULT_ERROR) as ApiError;
			}
			return data as T;
		} catch {
			return { error: 'network_error', message: 'Network error — please try again' };
		}
	}
}

export function postJson<T>(path: string, body: unknown, token?: string, cookies?: Cookies): Promise<T | ApiError> {
	return request<T>(path, { method: 'POST', body, token, cookies });
}

export function putJson<T>(path: string, body: unknown, token: string, cookies?: Cookies): Promise<T | ApiError> {
	return request<T>(path, { method: 'PUT', body, token, cookies });
}

export function getJson<T>(path: string, token: string, cookies?: Cookies): Promise<T | ApiError> {
	return request<T>(path, { token, cookies });
}

export function deleteRequest<T>(path: string, token: string, cookies?: Cookies): Promise<T | ApiError> {
	return request<T>(path, { method: 'DELETE', token, cookies });
}
