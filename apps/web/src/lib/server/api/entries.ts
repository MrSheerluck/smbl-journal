import type { Cookies } from '@sveltejs/kit';
import { getJson, postJson, deleteRequest } from './rust';

export interface Entry {
	id: string;
	entry_date: string;
	body_ciphertext: string;
	body_iv: string;
}

export interface EntryMeta {
	id: string;
	entry_date: string;
}

export async function listEntries(token: string, cookies?: Cookies): Promise<EntryMeta[]> {
	const result = await getJson<EntryMeta[]>('/entries', token, cookies);
	return Array.isArray(result) ? result : [];
}

export async function getEntry(token: string, date: string, cookies?: Cookies): Promise<Entry | null> {
	const result = await getJson<Entry>(`/entries?date=${encodeURIComponent(date)}`, token, cookies);
	return 'body_ciphertext' in result ? result : null;
}

export async function saveEntry(token: string, payload: Entry, cookies?: Cookies): Promise<boolean> {
	const result = await postJson<{ ok: boolean }>('/entries', payload, token, cookies);
	return 'ok' in result && result.ok === true;
}

export async function deleteEntry(token: string, date: string, cookies?: Cookies): Promise<boolean> {
	const result = await deleteRequest<{ ok: boolean }>(
		`/entries?date=${encodeURIComponent(date)}`,
		token,
		cookies
	);
	return 'ok' in result && result.ok === true;
}
