import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { reviews } from '#lib/server/db/schema.ts';
import { memberVouchers } from '#lib/server/club.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const m = locals.member!;
	const now = new Date().toISOString();
	return {
		ready: memberVouchers(db, m.id).filter((v) => v.status === 'ready' && v.expiresAt > now).length,
		birthday: m.birthday,
		review: db.select({ status: reviews.status }).from(reviews).where(eq(reviews.memberId, m.id)).get()?.status ?? null
	};
};
