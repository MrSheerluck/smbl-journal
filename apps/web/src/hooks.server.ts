import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {

	// Replace with a real /auth/me call later
	event.locals.session = { workosId: 'mock-user', email: 'you@example.com' };
	return resolve(event);
};
