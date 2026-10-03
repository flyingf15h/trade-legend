import { fail, redirect } from '@sveltejs/kit';
import { eq, like, or } from 'drizzle-orm';
import { STAFF_PIN } from '$app/env/private';
import { db } from '#lib/server/db/index.ts';
import { members, vouchers } from '#lib/server/db/schema.ts';
import { signOut, staffSignIn } from '#lib/server/auth.ts';
import { ClubError, useVoucher } from '#lib/server/club.ts';
import { REWARDS } from '#lib/rewards.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (!locals.staff) return { voucher: null };
	const code = url.searchParams.get('voucher');
	if (!code) return { voucher: null };
	const v = db
		.select({ v: vouchers, name: members.name, memberId: members.id })
		.from(vouchers)
		.innerJoin(members, eq(members.id, vouchers.memberId))
		.where(eq(vouchers.code, code))
		.get();
	return { voucher: v ? { ...v.v, name: v.name, memberId: v.memberId, title: REWARDS[v.v.rewardKey].title, terms: REWARDS[v.v.rewardKey].terms } : null };
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const pin = String((await request.formData()).get('pin') ?? '');
		// a little delay so the PIN can't be guessed quickly
		await new Promise((r) => setTimeout(r, 400));
		if (pin !== STAFF_PIN) return fail(400, { error: 'That PIN isn’t right.' });
		staffSignIn(db, cookies);
		redirect(303, '/staff');
	},
	logout: ({ cookies }) => {
		signOut(db, cookies, true);
		redirect(303, '/staff');
	},
	lookup: async ({ request, locals }) => {
		if (!locals.staff) redirect(303, '/staff');
		const q = String((await request.formData()).get('q') ?? '').trim();
		if (!q) return fail(400, { q, error: 'Scan a card or type a phone number.' });
		const upper = q.toUpperCase();
		if (upper.startsWith('TREAT-')) redirect(303, `/staff?voucher=${encodeURIComponent(upper)}`);
		const digits = q.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
		const found = db
			.select({ id: members.id, name: members.name, phone: members.phone })
			.from(members)
			.where(
				or(
					eq(members.cardCode, upper),
					digits.length >= 4 ? like(members.phone, `%${digits}`) : undefined,
					like(members.name, q)
				)
			)
			.limit(10)
			.all();
		if (found.length === 1) redirect(303, `/staff/m/${found[0].id}`);
		if (found.length === 0) return fail(404, { q, error: 'No member found.' });
		return { q, matches: found };
	},
	use: async ({ request, locals }) => {
		if (!locals.staff) redirect(303, '/staff');
		const code = String((await request.formData()).get('code') ?? '');
		try {
			const v = useVoucher(db, code);
			return { used: REWARDS[v.rewardKey].title };
		} catch (e) {
			if (e instanceof ClubError) return fail(400, { error: e.message });
			throw e;
		}
	}
};
