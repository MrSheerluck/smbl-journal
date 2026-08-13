import { getJson, putJson } from './rust';
import type { Session } from './auth';

export async function getMe(token: string): Promise<Session | null> {
	const result = await getJson<Session>('/auth/me', token);
	return 'workos_id' in result ? result : null;
}

export async function saveVault(token: string, payload: unknown): Promise<boolean> {
	const result = await putJson<{ ok: boolean }>('/auth/me/vault', payload, token);
	return 'ok' in result && result.ok === true;
}
