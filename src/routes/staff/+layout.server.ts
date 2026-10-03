import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.staff && url.pathname !== '/staff') redirect(303, '/staff');
	return { staff: locals.staff };
};
