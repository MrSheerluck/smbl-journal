import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Actions } from './$types';
import { requestPasswordReset } from '$lib/server/api';

export const actions: Actions = {
	default: async ({ request }: RequestEvent) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();

		if (!email) return fail(400, { email, error: 'Enter your email.' });

		await requestPasswordReset(email);
		return { sent: true, email };
	}
};
