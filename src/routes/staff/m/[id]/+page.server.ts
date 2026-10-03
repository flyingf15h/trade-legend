import { error, fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { members, purchases } from '#lib/server/db/schema.ts';
import { ClubError, balance, memberVouchers, pendingBoosts, recordPurchase, returnPurchase, useVoucher } from '#lib/server/club.ts';
import { REWARDS } from '#lib/rewards.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	const m = await db.select().from(members).where(eq(members.id, id)).get();
	if (!m) error(404, 'No such member');
	const now = new Date().toISOString();
	return {
		m: { id: m.id, name: m.name, phone: m.phone, icon: m.icon, birthday: m.birthday, cardCode: m.cardCode },
		balance: await balance(db, id),
		boosts: await pendingBoosts(db, id),
		ready: (await memberVouchers(db, id))
			.filter((v) => v.status === 'ready' && v.expiresAt > now)
			.map((v) => ({ code: v.code, title: REWARDS[v.rewardKey].title, expiresAt: v.expiresAt })),
		purchases: await db.select().from(purchases).where(eq(purchases.memberId, id)).orderBy(desc(purchases.id)).limit(8).all()
	};
};

async function guard<T>(fn: () => Promise<T>) {
	try {
		return await fn();
	} catch (e) {
		if (e instanceof ClubError) return fail(400, { error: e.message });
		throw e;
	}
}

export const actions: Actions = {
	purchase: async ({ request, params }) => {
		const f = await request.formData();
		const dollars = Number(String(f.get('amount') ?? '').replace(/[$,\s]/g, ''));
		const description = String(f.get('description') ?? '').trim() || undefined;
		if (!Number.isFinite(dollars) || dollars <= 0 || dollars > 2000) return fail(400, { error: 'Enter the amount paid, before tax and tip.' });
		return guard(async () => {
			const r = await recordPurchase(db, Number(params.id), Math.round(dollars * 100), description);
			return { earned: Math.round(r.earned * 100) / 100, doubled: r.purchase.doubled };
		});
	},
	return: async ({ request }) => {
		const id = Number((await request.formData()).get('purchase'));
		return guard(async () => ({ returned: await returnPurchase(db, id) }));
	},
	use: async ({ request }) => {
		const code = String((await request.formData()).get('code') ?? '');
		return guard(async () => ({ used: REWARDS[(await useVoucher(db, code)).rewardKey].title }));
	}
};
