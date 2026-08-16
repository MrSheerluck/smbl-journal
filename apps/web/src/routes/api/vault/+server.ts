import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { SESSION_COOKIE, getVault, saveVault, resetVault } from '$lib/server/api';



export async function GET({ cookies }: RequestEvent) {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return json({ error: 'no session' }, { status: 401 });
	const vault = await getVault(token, cookies);
	if (!vault) return json({ error: 'no vault' }, { status: 404 });
	return json(vault);
}

export async function PUT({ request, cookies }: RequestEvent) {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) {
		return json({ error: 'no session' }, { status: 401 });
	}

	const body = await request.json();
	const ok = await saveVault(token, body, cookies);
	if (!ok) {
		return json({ error: 'failed to save vault' }, { status: 500 });
	}

	return json({ ok: true });
}

export async function DELETE({ cookies }: RequestEvent) {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return json({ error: 'no session' }, { status: 401 });
	const ok = await resetVault(token, cookies);
	if (!ok) return json({ error: 'failed to reset vault' }, { status: 500 });
	return json({ ok: true });
}
