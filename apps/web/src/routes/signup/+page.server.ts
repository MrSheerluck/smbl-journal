import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Actions } from './$types';
import { signup, setPendingCookie, type ApiError } from '$lib/server/api';

export const actions: Actions = {
	default: async ({ request, cookies }: RequestEvent) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const confirm = String(data.get('confirm') ?? '');

		if (!email) return fail(400, { email, error: 'Enter your email.' });
		if (password.length < 8) {
			return fail(400, { email, error: 'Password must be at least 8 characters.' });
		}
		if (password !== confirm) {
			return fail(400, { email, error: 'Passwords don\'t match.' });
		}

		const result = await signup(email, password);

		if ('ok' in result) {
			setPendingCookie(cookies, result.pending_authentication_token);
			throw redirect(303, `/verify-email?email=${encodeURIComponent(email)}`);
		}

		const err = result as ApiError;
		return fail(400, {
			email,
			error: err.message || 'Could not create your account. Please try again.'
		});
	}
};
