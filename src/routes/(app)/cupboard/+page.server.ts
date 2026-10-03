import { and, desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { clawPlays } from '#lib/server/db/schema.ts';
import { playsToday } from '#lib/server/club.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const m = locals.member!;
	const recent = db
		.select({ id: clawPlays.id, prizeKey: clawPlays.prizeKey, capsule: clawPlays.capsule, createdAt: clawPlays.createdAt })
		.from(clawPlays)
		.where(and(eq(clawPlays.memberId, m.id)))
		.orderBy(desc(clawPlays.id))
		.limit(6)
		.all();
	const turns = playsToday(db, m.id);
	return { freePlay: turns === 0, turns, recent };
};
