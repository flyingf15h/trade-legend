import { db } from '#lib/server/db/index.ts';
import { memberVouchers, pendingBoosts, playsToday } from '#lib/server/club.ts';
import { ballot, featuredFlavour } from '#lib/server/flavours.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const m = locals.member!;
	const now = new Date().toISOString();
	const ready = (await memberVouchers(db, m.id)).filter((v) => v.status === 'ready' && v.expiresAt > now);
	const b = await ballot(db, m.id);
	return {
		ready: ready.slice(0, 3).map((v) => ({ code: v.code, rewardKey: v.rewardKey, expiresAt: v.expiresAt })),
		readyCount: ready.length,
		freePlay: await playsToday(db, m.id) === 0,
		boosts: await pendingBoosts(db, m.id),
		featured: await featuredFlavour(db),
		ballot: b ? { closesOn: b.round.closesOn, voted: b.votedFor !== null } : null
	};
};
