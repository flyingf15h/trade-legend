import { and, desc, eq, isNotNull } from 'drizzle-orm';
import type { DB } from './db';
import { candidates, rounds, votes } from './db/schema';
import { monthOf, today } from './time';
import { openRound, settleRounds } from './club';

export function featuredFlavour(db: DB) {
	settleRounds(db);
	const r = db.select().from(rounds).where(eq(rounds.month, monthOf(today()))).get();
	if (!r?.winnerId) return null;
	return db.select().from(candidates).where(eq(candidates.id, r.winnerId)).get() ?? null;
}

export function ballot(db: DB, memberId: number) {
	settleRounds(db);
	const round = openRound(db);
	if (!round) return null;
	const cands = db.select().from(candidates).where(eq(candidates.roundId, round.id)).all();
	const mine = db
		.select()
		.from(votes)
		.where(and(eq(votes.roundId, round.id), eq(votes.memberId, memberId)))
		.get();
	return { round, candidates: cands, votedFor: mine?.candidateId ?? null };
}

export function archive(db: DB) {
	settleRounds(db);
	return db
		.select({ month: rounds.month, round: rounds.id, c: candidates })
		.from(rounds)
		.innerJoin(candidates, eq(candidates.id, rounds.winnerId))
		.where(isNotNull(rounds.winnerId))
		.orderBy(desc(rounds.month))
		.all();
}

// The most recent round that closed without a clear winner, waiting on Grandma.
export function awaitingGrandma(db: DB) {
	settleRounds(db);
	const day = today();
	return db
		.select()
		.from(rounds)
		.orderBy(desc(rounds.closesOn))
		.all()
		.filter((r) => !r.winnerId && r.closesOn < day);
}
