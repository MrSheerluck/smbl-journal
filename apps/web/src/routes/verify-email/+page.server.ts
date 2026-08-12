import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	PENDING_COOKIE,
	verifyEmail,
	setSessionCookie,
	type ApiError
} from '$lib/server/api';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const email = url.searchParams.get('email') ?? '';
	const code = url.searchParams.get('code') ?? '';
	const token = url.searchParams.get('pending_authentication_token') ?? '';
	const hasPending = Boolean(cookies.get(PENDING_COOKIE));

	// Verification-link mode: WorkOS redirected here with a code + pending token.
	if (code && token) {
		const result = await verifyEmail(code, token);
		if ('access_token' in result) {
			setSessionCookie(cookies, result);
			throw redirect(303, result.vault_setup ? '/home' : '/setup');
		}
		const err = result as ApiError;
		return {
			status: 'error' as const,
			email,
			error: err.message || 'We couldn\'t verify your email. The link may have expired.'
		};
	}

	// One-time-code mode: we hold a pending token from signup; show a code form.
	if (hasPending) {
		return { status: 'code' as const, email, error: null };
	}

	// Just signed up; pending token not yet set (or expired) — tell them to check email.
	return { status: 'check-email' as const, email, error: null };
};

export const actions: Actions = {
	default: async ({ request, cookies }: RequestEvent) => {
		const data = await request.formData();
		const code = String(data.get('code') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const pendingToken = cookies.get(PENDING_COOKIE);

		if (!code) return fail(400, { email, error: 'Enter the code from your email.' });
		if (!pendingToken) {
			return fail(400, {
				email,
				error: 'Your verification session expired. Please sign up again.'
			});
		}

		const result = await verifyEmail(code, pendingToken);
		cookies.delete(PENDING_COOKIE, { path: '/' });

		if ('access_token' in result) {
			setSessionCookie(cookies, result);
			throw redirect(303, result.vault_setup ? '/home' : '/setup');
		}

		const err = result as ApiError;
		return fail(400, {
			email,
			error: err.message || 'That code didn\'t work. Please check and try again.'
		});
	}
};
