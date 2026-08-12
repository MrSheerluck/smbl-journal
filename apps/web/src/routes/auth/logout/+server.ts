import { SESSION_COOKIE, revokeSession } from '$lib/server/api';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
	try {
		const part = token.split('.')[1];
		if (!part) return null;
		const bin = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
		const bytes = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
		return JSON.parse(new TextDecoder().decode(bytes));
	} catch {
		return null;
	}
}

export async function POST({ cookies }) {
	const token = cookies.get(SESSION_COOKIE);
	const payload = token ? decodeJwtPayload(token) : null;
	const sessionId = typeof payload?.sid === 'string' ? payload.sid : null;

	// End the session at WorkOS server-side (so a stale token can't be reused),
	// then clear the cookie. Best-effort: the cookie is always cleared.
	if (sessionId) {
		await revokeSession(sessionId);
	}

	cookies.delete(SESSION_COOKIE, { path: '/' });

	return new Response(null, { status: 303, headers: { location: '/login' } });
}
