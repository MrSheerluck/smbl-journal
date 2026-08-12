import { env } from '$env/dynamic/private';

export const RUST_ORIGIN = env.API_URL || 'http://localhost:8080';

export interface ApiError {
	error: string;
	message: string;
}

interface RequestOptions {
	method?: string;
	body?: unknown;
	token?: string;
}

/**
 * Thin client for the Rust API. All calls are server-to-server from the BFF.
 * Returns `ApiError` on failure so callers can surface the WorkOS error code.
 */
async function request<T>(path: string, opts: RequestOptions = {}): Promise<T | ApiError> {
	const headers: Record<string, string> = { 'content-type': 'application/json' };
	if (opts.token) headers.authorization = `Bearer ${opts.token}`;

	try {
		const res = await fetch(`${RUST_ORIGIN}${path}`, {
			method: opts.method ?? 'GET',
			headers,
			body: opts.body === undefined ? undefined : JSON.stringify(opts.body)
		});
		const data = await res.json().catch(() => null);
		if (!res.ok) {
			return (data ?? {
				error: 'request_failed',
				message: 'The request failed. Please try again.'
			}) as ApiError;
		}
		return data as T;
	} catch {
		return { error: 'network_error', message: 'Network error — please try again' };
	}
}

export function postJson<T>(path: string, body: unknown): Promise<T | ApiError> {
	return request<T>(path, { method: 'POST', body });
}

export function putJson<T>(path: string, body: unknown, token: string): Promise<T | ApiError> {
	return request<T>(path, { method: 'PUT', body, token });
}

export function getJson<T>(path: string, token: string): Promise<T | ApiError> {
	return request<T>(path, { token });
}
