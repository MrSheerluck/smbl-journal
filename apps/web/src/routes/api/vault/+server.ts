import { json } from '@sveltejs/kit';
import { saveVault } from '$lib/server/api';

export async function PUT({ request, cookies }) {
	const token = cookies.get('smbl.session');
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
