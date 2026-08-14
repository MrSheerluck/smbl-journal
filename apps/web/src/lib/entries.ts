import { encryptText, decryptText, bytesToBase64, base64ToBytes } from '@smbl/shared';
import { getVaultKey } from './vault';

export interface Entry {
	id: string;
	entry_date: string;
	body_ciphertext: string;
	body_iv: string;
}

export function todayLocal(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export async function saveTodayEntry(body: string): Promise<void> {
	const key = getVaultKey();
	if (!key) throw new Error('Vault is locked');
	const { iv, ciphertext } = await encryptText(key, body);
	const payload: Entry = {
		id: crypto.randomUUID(),
		entry_date: todayLocal(),
		body_ciphertext: bytesToBase64(ciphertext),
		body_iv: bytesToBase64(iv)
	};
	const res = await fetch('/api/entries', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error('Failed to save entry');
}

export async function loadEntry(date: string): Promise<string | null> {
	const key = getVaultKey();
	if (!key) throw new Error('Vault is locked');
	const res = await fetch(`/api/entries?date=${encodeURIComponent(date)}`);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error('Failed to load entry');
	const entry = (await res.json()) as Entry;
	return decryptText(key, base64ToBytes(entry.body_iv), base64ToBytes(entry.body_ciphertext));
}
