import type { Handle } from '@sveltejs/kit';
import { getMe } from '$lib/server/api';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('smbl.session');

	if (token) {
		event.locals.session = await getMe(token);
	} else {
		event.locals.session = null;
	}

	return resolve(event);
};
