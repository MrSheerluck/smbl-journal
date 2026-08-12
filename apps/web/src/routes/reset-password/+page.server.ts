import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { confirmPasswordReset, type ApiError } from '$lib/server/api';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	if (!token) {
		return { token: null as string | null, error: 'This reset link is invalid or has expired.' };
	}
	return { token, error: null };
};

export const actions: Actions = {
	default: async ({ request }: RequestEvent) => {
		const data = await request.formData();
		const token = String(data.get('token') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const confirm = String(data.get('confirm') ?? '');

		if (!token) return fail(400, { error: 'This reset link is invalid or has expired.' });
		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}
		if (password !== confirm) {
			return fail(400, { error: 'Passwords don\'t match.' });
		}

		const result = await confirmPasswordReset(token, password);

		if ('ok' in result) {
			throw redirect(303, '/login?reset=1');
		}

		const err = result as ApiError;
		return fail(400, {
			error: err.message || 'Could not reset your password. The link may have expired.'
		});
	}
};
