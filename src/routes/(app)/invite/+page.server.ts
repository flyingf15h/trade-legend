import { desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { members, referrals } from '#lib/server/db/schema.ts';
import { qrSvg } from '#lib/server/qr.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const m = locals.member!;
	const link = `${url.origin}/hello/${m.referralCode}`;
	const rows = db
		.select({ id: referrals.id, status: referrals.status, createdAt: referrals.createdAt, name: members.name })
		.from(referrals)
		.leftJoin(members, eq(members.id, referrals.refereeId))
		.where(eq(referrals.referrerId, m.id))
		.orderBy(desc(referrals.id))
		.all();
	return { link, qr: await qrSvg(link), referrals: rows };
};
