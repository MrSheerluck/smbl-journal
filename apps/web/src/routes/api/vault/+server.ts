import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { SESSION_COOKIE, getVault, saveVault } from '$lib/server/api';



export async function GET({ cookies }: RequestEvent) {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return json({ error: 'no session' }, { status: 401 });
	const vault = await getVault(token);
	if (!vault) return json({ error: 'no vault' }, { status: 404 });
	return json(vault);
}

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
