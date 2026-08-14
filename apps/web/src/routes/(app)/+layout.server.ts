import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	const session = locals.session;

	if (!session) throw redirect(303, '/login');

	const path = url.pathname;
	if (path === '/setup' && session.vault_setup) throw redirect(303, '/home');
	if (path.startsWith('/home') && !session.vault_setup) throw redirect(303, '/setup');
	if (path.startsWith('/archive') && !session.vault_setup) throw redirect(303, '/setup');

	return { session };
};
