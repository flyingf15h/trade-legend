import { db } from '#lib/server/db/index.ts';
import { memberVouchers, pendingBoosts, playsToday } from '#lib/server/club.ts';
import { ballot, featuredFlavour } from '#lib/server/flavours.ts';
import { qrSvg } from '#lib/server/qr.ts';
import { reviews } from '#lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const m = locals.member!;
	const now = new Date().toISOString();
	const ready = memberVouchers(db, m.id).filter((v) => v.status === 'ready' && v.expiresAt > now);
	const b = ballot(db, m.id);
	return {
		qr: await qrSvg(m.cardCode),
		ready: ready.slice(0, 3).map((v) => ({ code: v.code, rewardKey: v.rewardKey, expiresAt: v.expiresAt })),
		readyCount: ready.length,
		freePlay: playsToday(db, m.id) === 0,
		boosts: pendingBoosts(db, m.id),
		featured: featuredFlavour(db),
		ballot: b ? { closesOn: b.round.closesOn, voted: b.votedFor !== null } : null,
		review: db.select({ status: reviews.status }).from(reviews).where(eq(reviews.memberId, m.id)).get()?.status ?? null
	};
};
