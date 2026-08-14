import { SESSION_COOKIE, deleteAccount } from '$lib/server/api';

export async function POST({ cookies }) {
	const token = cookies.get(SESSION_COOKIE);

	if (token) {
		await deleteAccount(token);
	}

	cookies.delete(SESSION_COOKIE, { path: '/' });

	return new Response(null, { status: 303, headers: { location: '/login' } });
}
