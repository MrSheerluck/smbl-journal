import { env } from '$env/dynamic/private';

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
	const token = cookies.get('smbl.session');
	const payload = token ? decodeJwtPayload(token) : null;
	const sessionId = typeof payload?.sid === 'string' ? payload.sid : null;

	cookies.delete('smbl.session', { path: '/' });
	cookies.delete('smbl.state', { path: '/' });

	if (sessionId) {
		// End the session at WorkOS too, so AuthKit doesn't auto-sign-in
		// the same account on the next attempt.
		const webOrigin = env.WEB_ORIGIN || 'http://localhost:5173';
		const params = new URLSearchParams({
			session_id: sessionId,
			return_to: `${webOrigin}/login`
		});
		const location = `https://api.workos.com/user_management/sessions/logout?${params.toString()}`;
		return new Response(null, { status: 303, headers: { location } });
	}

	return new Response(null, { status: 303, headers: { location: '/login' } });
}
