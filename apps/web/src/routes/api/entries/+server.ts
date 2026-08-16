import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { SESSION_COOKIE, getEntry, listEntries, saveEntry, deleteEntry } from '$lib/server/api';

export async function GET({ cookies, url }: RequestEvent) {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return json({ error: 'no session' }, { status: 401 });
	const date = url.searchParams.get('date');
	if (!date) {
		const entries = await listEntries(token, cookies);
		return json(entries);
	}
	const entry = await getEntry(token, date, cookies);
	if (!entry) return json({ error: 'no entry' }, { status: 404 });
	return json(entry);
}

export async function POST({ request, cookies }: RequestEvent) {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return json({ error: 'no session' }, { status: 401 });
	const body = await request.json();
	const ok = await saveEntry(token, body, cookies);
	if (!ok) return json({ error: 'failed to save entry' }, { status: 500 });
	return json({ ok: true });
}

export async function DELETE({ cookies, url }: RequestEvent) {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return json({ error: 'no session' }, { status: 401 });
	const date = url.searchParams.get('date');
	if (!date) return json({ error: 'missing date' }, { status: 400 });
	const ok = await deleteEntry(token, date, cookies);
	if (!ok) return json({ error: 'failed to delete entry' }, { status: 404 });
	return json({ ok: true });
}
