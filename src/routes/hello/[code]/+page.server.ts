import { redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { recordInviteVisit } from '#lib/server/club.ts';
import { token } from '#lib/server/codes.ts';
import type { PageServerLoad } from './$types';

// A neighbour's invite link. Remember who sent it so the referral is credited when they join.
export const load: PageServerLoad = async ({ params, cookies, locals }) => {
	if (locals.member) redirect(303, '/kitchen');
	const code = params.code.toUpperCase();
	const visit = cookies.get('cc_visit') ?? token();
	const opts = { path: '/', httpOnly: true, sameSite: 'lax' as const, maxAge: 30 * 86400 };
	cookies.set('cc_ref', code, opts);
	cookies.set('cc_visit', visit, opts);
	await recordInviteVisit(db, code, visit);
	redirect(303, '/join');
};
