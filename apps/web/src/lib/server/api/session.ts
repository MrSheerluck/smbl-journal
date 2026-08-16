import type { Cookies } from '@sveltejs/kit';
import { getJson, putJson, deleteRequest } from './rust';
import type { Session } from './auth';


export interface VaultData {
	wrapped: string;
	iv: string;
	salt: string;
	params: { iterations: number; memory: number; parallelism: number };
}

export async function getMe(token: string, cookies?: Cookies): Promise<Session | null> {
	const result = await getJson<Session>('/auth/me', token, cookies);
	return 'workos_id' in result ? result : null;
}

export async function saveVault(token: string, payload: unknown, cookies?: Cookies): Promise<boolean> {
	const result = await putJson<{ ok: boolean }>('/auth/me/vault', payload, token, cookies);
	return 'ok' in result && result.ok === true;
}


export async function getVault(token: string, cookies?: Cookies): Promise<VaultData | null> {
	const result = await getJson<VaultData>('/auth/me/vault', token, cookies);
	return 'wrapped' in result ? result : null;
}

export async function resetVault(token: string, cookies?: Cookies): Promise<boolean> {
	const result = await deleteRequest<{ ok: boolean }>('/auth/me/vault', token, cookies);
	return 'ok' in result && result.ok === true;
}

export async function deleteAccount(token: string, cookies?: Cookies): Promise<boolean> {
	const result = await deleteRequest<{ ok: boolean }>('/auth/me', token, cookies);
	return 'ok' in result && result.ok === true;
}
