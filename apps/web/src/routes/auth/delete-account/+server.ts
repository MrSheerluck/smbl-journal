import { REFRESH_COOKIE, SESSION_COOKIE, deleteAccount } from '$lib/server/api';

export async function POST({ cookies }) {
	const token = cookies.get(SESSION_COOKIE);

	if (token) {
		await deleteAccount(token, cookies);
	}

	cookies.delete(SESSION_COOKIE, { path: '/' });
	cookies.delete(REFRESH_COOKIE, { path: '/' });

	return new Response(null, { status: 303, headers: { location: '/login' } });
}
