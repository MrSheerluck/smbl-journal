import { env } from '$env/dynamic/private';
import { secureCookies } from '$lib/server/api';
import { nonce, stateCookieName } from '$lib/server/state';

export async function GET({ url, cookies }) {
	const state = nonce();

	cookies.set(stateCookieName(state), state, {
		httpOnly: true,
		sameSite: 'lax',
		secure: secureCookies(),
		path: '/',
		maxAge: 1800
	});

	const screen = url.searchParams.get('screen');

	const params = new URLSearchParams({
		response_type: 'code',
		client_id: env.WORKOS_CLIENT_ID,
		redirect_uri: env.WORKOS_REDIRECT_URI,
		provider: 'authkit',
		// Force re-authentication so leftover WorkOS sessions can't
		// auto-complete the flow (e.g. silently signing into an old account).
		max_age: '0',
		state
	});

	if (screen === 'sign-up') {
		params.set('screen_hint', 'sign-up');
	}

	const location = `https://api.workos.com/user_management/authorize?${params.toString()}`;
	return new Response(null, { status: 302, headers: { location } });
}
