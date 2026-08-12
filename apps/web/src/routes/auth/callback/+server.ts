import { exchangeCode, secureCookies } from '$lib/server/api';
import { stateCookieName } from '$lib/server/state';

export async function GET({ url, cookies }) {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const workosError = url.searchParams.get('error');

	// Each flow stores its state under a cookie named after a hash of that
	// state (mirrors WorkOS's own SDK), so concurrent flows never overwrite
	// each other and stale cookies can't break new attempts.
	const cookieName = state ? stateCookieName(state) : '';

	if (workosError) {
		return new Response(
			`Login failed: WorkOS error (${workosError}) - ${url.searchParams.get('error_description')}`,
			{ status: 400 }
		);
	}

	if (!code || !state) {
		return new Response('Login failed: missing auth parameters', { status: 400 });
	}

	const savedState = cookies.get(cookieName);

	// CSRF protection: the state must match what we set in /auth/login.
	if (!savedState || state !== savedState) {
		return new Response('Login failed: state check failed', { status: 400 });
	}

	cookies.delete(cookieName, { path: '/' });

	const result = await exchangeCode(code);
	if (!result) {
		return new Response('Login failed: code exchange failed', { status: 400 });
	}

	cookies.set('smbl.session', result.access_token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: secureCookies(),
		path: '/',
		maxAge: 3600
	});

	const location = result.vault_setup ? '/home' : '/setup';
	return new Response(null, { status: 303, headers: { location } });
}
