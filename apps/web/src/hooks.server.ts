import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, getMe } from '$lib/server/api';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);

	if (token) {
		event.locals.session = await getMe(token);
	} else {
		event.locals.session = null;
	}

	return resolve(event);
};
