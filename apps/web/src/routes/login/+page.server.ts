import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Actions } from './$types';
import {
	loginWithPassword,
	setPendingCookie,
	setSessionCookie,
	type ApiError
} from '$lib/server/api';

export const actions: Actions = {
	default: async ({ request, cookies }: RequestEvent) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, error: 'Enter your email and password.' });
		}

		const result = await loginWithPassword(email, password);

		if ('access_token' in result) {
			setSessionCookie(cookies, result);
			throw redirect(303, result.vault_setup ? '/home' : '/setup');
		}

		const err = result as ApiError & { pending_authentication_token?: string };

		// Account exists but the email was never verified — a verification code
		// was just emailed; hold the pending token and route to the code form.
		if (err.error === 'email_verification_required' && err.pending_authentication_token) {
			setPendingCookie(cookies, err.pending_authentication_token);
			throw redirect(303, `/verify-email?email=${encodeURIComponent(email)}`);
		}

		return fail(401, { email, error: err.message || 'Login failed. Please try again.' });
	}
};
