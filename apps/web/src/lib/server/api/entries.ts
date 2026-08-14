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

export async function listEntries(token: string): Promise<EntryMeta[]> {
	const result = await getJson<EntryMeta[]>('/entries', token);
	return Array.isArray(result) ? result : [];
}

export async function getEntry(token: string, date: string): Promise<Entry | null> {
	const result = await getJson<Entry>(`/entries?date=${encodeURIComponent(date)}`, token);
	return 'body_ciphertext' in result ? result : null;
}

export async function saveEntry(token: string, payload: Entry): Promise<boolean> {
	const result = await postJson<{ ok: boolean }>('/entries', payload, token);
	return 'ok' in result && result.ok === true;
}

export async function deleteEntry(token: string, date: string): Promise<boolean> {
	const result = await deleteRequest<{ ok: boolean }>(
		`/entries?date=${encodeURIComponent(date)}`,
		token
	);
	return 'ok' in result && result.ok === true;
}
