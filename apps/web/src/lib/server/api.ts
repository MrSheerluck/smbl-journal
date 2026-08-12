import { env } from '$env/dynamic/private';

export interface Session {
	workos_id: string;
	email: string;
	vault_setup: boolean;
}

interface ExchangeResult extends Session {
	access_token: string;
}

const RUST_ORIGIN = env.API_URL || 'http://localhost:8080';

export function secureCookies(): boolean {
	return env.SECURE_COOKIES === 'true';
}

export async function getMe(token: string): Promise<Session | null> {
	try {
		const res = await fetch(`${RUST_ORIGIN}/auth/me`, {
			headers: { authorization: `Bearer ${token}` }
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

export async function exchangeCode(code: string): Promise<ExchangeResult | null> {
	try {
		const res = await fetch(`${RUST_ORIGIN}/auth/exchange`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ code })
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

export async function saveVault(token: string, payload: unknown): Promise<boolean> {
	try {
		const res = await fetch(`${RUST_ORIGIN}/auth/me/vault`, {
			method: 'PUT',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
			body: JSON.stringify(payload)
		});
		return res.ok;
	} catch {
		return false;
	}
}
