import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { SESSION_COOKIE, saveVault } from '$lib/server/api';

export async function PUT({ request, cookies }: RequestEvent) {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) {
		return json({ error: 'no session' }, { status: 401 });
	}

	const body = await request.json();
	const ok = await saveVault(token, body);
	if (!ok) {
		return json({ error: 'failed to save vault' }, { status: 500 });
	}

	return json({ ok: true });
}
