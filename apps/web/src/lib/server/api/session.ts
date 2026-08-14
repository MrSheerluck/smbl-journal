import { getJson, putJson, deleteRequest } from './rust';
import type { Session } from './auth';


export interface VaultData {
	wrapped: string;
	iv: string;
	salt: string;
	params: { iterations: number; memory: number; parallelism: number };
}

export async function getMe(token: string): Promise<Session | null> {
	const result = await getJson<Session>('/auth/me', token);
	return 'workos_id' in result ? result : null;
}

export async function saveVault(token: string, payload: unknown): Promise<boolean> {
	const result = await putJson<{ ok: boolean }>('/auth/me/vault', payload, token);
	return 'ok' in result && result.ok === true;
}


export async function getVault(token: string): Promise<VaultData | null> {
	const result = await getJson<VaultData>('/auth/me/vault', token);
	return 'wrapped' in result ? result : null;
}

export async function resetVault(token: string): Promise<boolean> {
	const result = await deleteRequest<{ ok: boolean }>('/auth/me/vault', token);
	return 'ok' in result && result.ok === true;
}
