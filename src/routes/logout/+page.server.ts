import { redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { signOut } from '#lib/server/auth.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: ({ cookies }) => {
		signOut(db, cookies);
		redirect(303, '/join?mode=back');
	}
};
