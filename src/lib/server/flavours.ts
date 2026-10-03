import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { DB } from './db';
import { candidates, rounds, votes } from './db/schema';
import { monthOf, today } from './time';
import { openRound, settleRounds } from './club';

export async function featuredFlavour(db: DB) {
	await settleRounds(db);
	const r = await db.select().from(rounds).where(eq(rounds.month, monthOf(today()))).get();
	if (!r?.winnerId) return null;
	return await db.select().from(candidates).where(eq(candidates.id, r.winnerId)).get() ?? null;
}

export async function ballot(db: DB, memberId: number) {
	await settleRounds(db);
	const round = await openRound(db);
	if (!round) return null;
	const cands = await db.select().from(candidates).where(eq(candidates.roundId, round.id)).all();
	const mine = await db
		.select()
		.from(votes)
		.where(and(eq(votes.roundId, round.id), eq(votes.memberId, memberId)))
		.get();
	return { round, candidates: cands, votedFor: mine?.candidateId ?? null };
}

export async function archive(db: DB) {
	await settleRounds(db);
	return await db
		.select({ month: rounds.month, round: rounds.id, c: candidates })
		.from(rounds)
		.innerJoin(candidates, eq(candidates.id, rounds.winnerId))
		.where(isNotNull(rounds.winnerId))
		.orderBy(desc(rounds.month))
		.all();
}

// The most recent round that closed without a clear winner, waiting on Grandma.
export async function awaitingGrandma(db: DB) {
	await settleRounds(db);
	const day = today();
	const all = await db.select().from(rounds).orderBy(desc(rounds.closesOn)).all();
	return all.filter((r) => !r.winnerId && r.closesOn < day);
}
