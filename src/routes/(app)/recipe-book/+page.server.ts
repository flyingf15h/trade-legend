import { desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { ledger } from '#lib/server/db/schema.ts';
import { memberVouchers } from '#lib/server/club.ts';
import { qrSvg } from '#lib/server/qr.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const m = locals.member!;
	const now = new Date().toISOString();
	const all = memberVouchers(db, m.id);
	const ready = await Promise.all(
		all
			.filter((v) => v.status === 'ready' && v.expiresAt > now)
			.map(async (v) => ({ ...v, qr: await qrSvg(v.code) }))
	);
	const past = all
		.filter((v) => !(v.status === 'ready' && v.expiresAt > now))
		.map((v) => ({ ...v, status: v.status === 'ready' ? 'expired' : v.status }));
	const history = db
		.select({ id: ledger.id, centi: ledger.centi, kind: ledger.kind, note: ledger.note, createdAt: ledger.createdAt })
		.from(ledger)
		.where(eq(ledger.memberId, m.id))
		.orderBy(desc(ledger.createdAt), desc(ledger.id))
		.limit(200)
		.all();
	return { ready, past, history };
};
