import { encryptText, decryptText, bytesToBase64, base64ToBytes } from '@smbl/shared';
import { getVaultKey } from './vault';

export interface Entry {
	id: string;
	entry_date: string;
	body_ciphertext: string;
	body_iv: string;
}

const entryCache = new Map<string, string>();

function pad2(n: number): string {
	return String(n).padStart(2, '0');
}

export function todayLocal(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export async function saveEntry(date: string, body: string): Promise<void> {
	const key = getVaultKey();
	if (!key) throw new Error('Vault is locked');
	const { iv, ciphertext } = await encryptText(key, body);
	const payload: Entry = {
		id: crypto.randomUUID(),
		entry_date: date,
		body_ciphertext: bytesToBase64(ciphertext),
		body_iv: bytesToBase64(iv)
	};
	const res = await fetch('/api/entries', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new Error('Failed to save entry');
	entryCache.set(date, body);
}

export async function saveTodayEntry(body: string): Promise<void> {
	return saveEntry(todayLocal(), body);
}

export async function loadEntry(date: string): Promise<string | null> {
	const cached = entryCache.get(date);
	if (cached !== undefined) return cached;
	const key = getVaultKey();
	if (!key) throw new Error('Vault is locked');
	const res = await fetch(`/api/entries?date=${encodeURIComponent(date)}`);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error('Failed to load entry');
	const entry = (await res.json()) as Entry;
	const text = await decryptText(key, base64ToBytes(entry.body_iv), base64ToBytes(entry.body_ciphertext));
	entryCache.set(date, text);
	return text;
}

function monthBounds(year: number, monthIndex: number): { start: string; end: string } {
	const first = new Date(year, monthIndex, 1);
	const last = new Date(year, monthIndex + 1, 0);
	return {
		start: `${first.getFullYear()}-${pad2(first.getMonth() + 1)}-01`,
		end: `${last.getFullYear()}-${pad2(last.getMonth() + 1)}-${pad2(last.getDate())}`
	};
}

export async function prefetchMonthRange(start: string, end: string): Promise<void> {
	const key = getVaultKey();
	if (!key) return;
	const res = await fetch(`/api/entries?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
	if (!res.ok) return;
	const entries = (await res.json()) as Entry[];
	for (const e of entries) {
		const text = await decryptText(key, base64ToBytes(e.body_iv), base64ToBytes(e.body_ciphertext));
		entryCache.set(e.entry_date, text);
	}
}

export async function prefetchSurroundingMonths(): Promise<void> {
	const now = new Date();
	const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const current = monthBounds(now.getFullYear(), now.getMonth());
	const previous = monthBounds(prev.getFullYear(), prev.getMonth());
	await prefetchMonthRange(previous.start, current.end);
}

export async function listEntryDates(): Promise<string[]> {
	const res = await fetch('/api/entries');
	if (!res.ok) throw new Error('Failed to list entries');
	const entries = (await res.json()) as { id: string; entry_date: string }[];
	return entries.map((e) => e.entry_date).sort().reverse();
}

export async function exportPlaintext(): Promise<string> {
	const key = getVaultKey();
	if (!key) throw new Error('Vault is locked');
	const dates = await listEntryDates();
	const blocks: string[] = [];
	for (const date of dates) {
		const body = await loadEntry(date);
		if (body) {
			blocks.push(`# ${date}\n\n${body}\n`);
		}
	}
	return blocks.join('\n---\n\n');
}

export async function deleteEntry(date: string): Promise<void> {
	const res = await fetch(`/api/entries?date=${encodeURIComponent(date)}`, { method: 'DELETE' });
	if (!res.ok && res.status !== 404) throw new Error('Failed to delete entry');
}
