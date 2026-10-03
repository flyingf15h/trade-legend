import { fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { ClubError, redeemShelf } from '#lib/server/club.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	redeem: async ({ request, locals }) => {
		const key = String((await request.formData()).get('key') ?? '');
		let code: string;
		try {
			code = (await redeemShelf(db, locals.member!.id, key)).code;
		} catch (e) {
			if (e instanceof ClubError) return fail(400, { key, error: e.message });
			throw e;
		}
		redirect(303, `/recipe-book?new=${code}#${code}`);
	}
};
