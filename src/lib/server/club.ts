import { randomInt } from 'node:crypto';
import { and, asc, count, desc, eq, gte, isNull, lte, sql, sum } from 'drizzle-orm';
import type { DB } from './db';
import {
	boosts,
	candidates,
	clawPlays,
	ledger,
	members,
	purchases,
	referrals,
	reviews,
	rounds,
	votes,
	vouchers
} from './db/schema';
import {
	CAPSULE_COLOURS,
	CUPBOARD_DAYS,
	EARN,
	PLAY_COST,
	REWARDS,
	ROUND_PRIZES,
	SHELF,
	SHELF_DAYS,
	SPECIAL_ODDS,
	SPECIAL_SHAPES,
	crumbs,
	type Prize
} from '#lib/rewards.ts';
import { voucherCode } from './codes';
import { addDays, inDays, monthOf, today } from './time';

// Drizzle hands transactions a narrower type than the db itself, but the query API is the same.
type Tx = Pick<DB, 'select' | 'insert' | 'update' | 'delete'>;

export class ClubError extends Error {}

export function balanceCenti(tx: Tx, memberId: number) {
	const row = tx.select({ total: sum(ledger.centi) }).from(ledger).where(eq(ledger.memberId, memberId)).get();
	return Number(row?.total ?? 0);
}

export function balance(tx: Tx, memberId: number) {
	return crumbs(balanceCenti(tx, memberId));
}

function credit(tx: Tx, memberId: number, amount: number, kind: string, note: string, purchaseId?: number) {
	tx.insert(ledger).values({ memberId, centi: Math.round(amount * 100), kind, note, purchaseId }).run();
}

function spend(tx: Tx, memberId: number, amount: number, kind: string, note: string) {
	if (balance(tx, memberId) < amount) throw new ClubError(`You need ${amount} Crumbs for that.`);
	credit(tx, memberId, -amount, kind, note);
}

function issueVoucher(tx: Tx, memberId: number, rewardKey: string, source: string, expiresAt: string) {
	const code = voucherCode();
	const row = tx
		.insert(vouchers)
		.values({ memberId, code, rewardKey, source, expiresAt })
		.returning()
		.get();
	return row;
}

/* ---------- purchases ---------- */

const RECEIPT_LINES = [
	'A little something from the case',
	'Warm from the oven',
	'A treat and a little happiness',
	'Something sweet for the road',
	'A good bake and a chat'
];

export function recordPurchase(db: DB, memberId: number, eligibleCents: number, description?: string) {
	if (!Number.isInteger(eligibleCents) || eligibleCents <= 0) throw new ClubError('Enter the amount paid.');
	return db.transaction((tx) => {
		const boost = tx
			.select()
			.from(boosts)
			.where(and(eq(boosts.memberId, memberId), isNull(boosts.usedOnPurchase)))
			.orderBy(asc(boosts.id))
			.get();
		const purchase = tx
			.insert(purchases)
			.values({ memberId, eligibleCents, description, doubled: !!boost })
			.returning()
			.get();
		if (boost) tx.update(boosts).set({ usedOnPurchase: purchase.id }).where(eq(boosts.id, boost.id)).run();

		const earned = (eligibleCents / 100) * EARN.crumbsPerDollar * (boost ? 2 : 1);
		const line = description?.trim()
			? `${description.trim()} and a little happiness`
			: RECEIPT_LINES[purchase.id % RECEIPT_LINES.length];
		credit(tx, memberId, earned, 'purchase', boost ? `${line} (double Crumbs!)` : line, purchase.id);

		completeReferral(tx, memberId, eligibleCents);
		return { purchase, earned };
	});
}

export function returnPurchase(db: DB, purchaseId: number) {
	return db.transaction((tx) => {
		const p = tx.select().from(purchases).where(eq(purchases.id, purchaseId)).get();
		if (!p) throw new ClubError('No such purchase.');
		if (p.returned) throw new ClubError('That purchase was already returned.');
		const earned = tx
			.select({ total: sum(ledger.centi) })
			.from(ledger)
			.where(and(eq(ledger.purchaseId, purchaseId), eq(ledger.kind, 'purchase')))
			.get();
		const centi = Number(earned?.total ?? 0);
		tx.update(purchases).set({ returned: true }).where(eq(purchases.id, purchaseId)).run();
		tx.insert(ledger)
			.values({ memberId: p.memberId, centi: -centi, kind: 'return', note: 'Returned purchase', purchaseId })
			.run();
		return centi / 100;
	});
}

/* ---------- referrals ---------- */

function completeReferral(tx: Tx, memberId: number, eligibleCents: number) {
	if (eligibleCents < EARN.referralMinCents) return;
	const ref = tx
		.select()
		.from(referrals)
		.where(and(eq(referrals.refereeId, memberId), eq(referrals.status, 'joined')))
		.get();
	if (!ref) return;
	const now = new Date().toISOString();
	tx.update(referrals).set({ status: 'completed', completedAt: now }).where(eq(referrals.id, ref.id)).run();

	const friend = tx.select({ name: members.name }).from(members).where(eq(members.id, memberId)).get();
	credit(tx, memberId, EARN.referee, 'referral', 'Welcome to the table, neighbour');

	const monthStart = monthOf(today()) + '-01';
	const done = tx
		.select({ n: count() })
		.from(referrals)
		.where(
			and(
				eq(referrals.referrerId, ref.referrerId),
				eq(referrals.status, 'completed'),
				gte(referrals.completedAt, monthStart)
			)
		)
		.get();
	// the row we just completed counts toward the limit
	if ((done?.n ?? 0) <= EARN.referralMonthlyLimit) {
		credit(tx, ref.referrerId, EARN.referrer, 'referral', `${friend?.name ?? 'Your neighbour'} came by for their first visit`);
	}
}

export function recordInviteVisit(db: DB, referralCode: string, visitorToken: string) {
	const referrer = db.select().from(members).where(eq(members.referralCode, referralCode)).get();
	if (!referrer) return;
	db.insert(referrals)
		.values({ referrerId: referrer.id, visitorToken })
		.onConflictDoNothing()
		.run();
}

export function linkReferral(tx: Tx, newMemberId: number, referralCode: string | undefined, visitorToken: string | undefined) {
	if (!referralCode) return;
	const referrer = tx.select().from(members).where(eq(members.referralCode, referralCode)).get();
	if (!referrer || referrer.id === newMemberId) return;
	tx.update(members).set({ referredBy: referrer.id }).where(eq(members.id, newMemberId)).run();
	const existing = visitorToken
		? tx
				.select()
				.from(referrals)
				.where(and(eq(referrals.visitorToken, visitorToken), eq(referrals.referrerId, referrer.id), isNull(referrals.refereeId)))
				.get()
		: undefined;
	if (existing) {
		tx.update(referrals).set({ refereeId: newMemberId, status: 'joined' }).where(eq(referrals.id, existing.id)).run();
	} else {
		tx.insert(referrals).values({ referrerId: referrer.id, refereeId: newMemberId, status: 'joined' }).run();
	}
}

/* ---------- Treat Shelf and vouchers ---------- */

export function redeemShelf(db: DB, memberId: number, key: string) {
	const item = SHELF.find((s) => s.key === key);
	if (!item) throw new ClubError('That treat is not on the shelf.');
	return db.transaction((tx) => {
		spend(tx, memberId, item.cost, 'redeem', `Traded for: ${REWARDS[key].title}`);
		return issueVoucher(tx, memberId, key, 'shelf', inDays(SHELF_DAYS));
	});
}

export function useVoucher(db: DB, code: string) {
	return db.transaction((tx) => {
		const v = tx.select().from(vouchers).where(eq(vouchers.code, code.trim().toUpperCase())).get();
		if (!v) throw new ClubError('No voucher with that code.');
		if (v.status !== 'ready') throw new ClubError(`That voucher was already ${v.status}.`);
		if (v.expiresAt < new Date().toISOString()) throw new ClubError('That voucher has expired.');
		tx.update(vouchers)
			.set({ status: 'used', usedAt: new Date().toISOString() })
			.where(eq(vouchers.id, v.id))
			.run();
		return v;
	});
}

export function memberVouchers(db: DB, memberId: number) {
	return db.select().from(vouchers).where(eq(vouchers.memberId, memberId)).orderBy(desc(vouchers.id)).all();
}

// A pastry during the birthday week (three days either side), once a year.
export function ensureBirthdayVoucher(db: DB, memberId: number, birthday: string | null) {
	if (!birthday) return;
	const day = today();
	const year = Number(day.slice(0, 4));
	for (const y of [year - 1, year, year + 1]) {
		const bday = `${y}-${birthday}`;
		if (day < addDays(bday, -3) || day > addDays(bday, 3)) continue;
		const already = db
			.select({ n: count() })
			.from(vouchers)
			.where(and(eq(vouchers.memberId, memberId), eq(vouchers.source, 'birthday'), gte(vouchers.createdAt, addDays(bday, -3))))
			.get();
		if ((already?.n ?? 0) > 0) return;
		issueVoucher(db, memberId, 'birthday', 'birthday', addDays(bday, 4) + 'T05:00:00.000Z');
		return;
	}
}

/* ---------- reviews ---------- */

export function submitReview(db: DB, memberId: number, link: string) {
	const clean = link.trim();
	if (!/^https?:\/\/\S+$/.test(clean)) throw new ClubError('Paste the link to your review.');
	const existing = db.select().from(reviews).where(eq(reviews.memberId, memberId)).get();
	if (existing?.status === 'approved') throw new ClubError('You already got Crumbs for a review. Thank you!');
	if (existing) {
		db.update(reviews).set({ link: clean, status: 'pending' }).where(eq(reviews.id, existing.id)).run();
	} else {
		db.insert(reviews).values({ memberId, link: clean }).run();
	}
}

export function approveReview(db: DB, reviewId: number) {
	db.transaction((tx) => {
		const r = tx.select().from(reviews).where(eq(reviews.id, reviewId)).get();
		if (!r || r.status !== 'pending') throw new ClubError('That review is not waiting for approval.');
		tx.update(reviews).set({ status: 'approved' }).where(eq(reviews.id, reviewId)).run();
		credit(tx, r.memberId, EARN.review, 'review', 'Thank you for the kind words');
	});
}

/* ---------- Tasting Table ---------- */

// Close any finished round: the most votes wins, and a tie waits for Grandma to pick.
export function settleRounds(db: DB) {
	const day = today();
	const open = db
		.select()
		.from(rounds)
		.where(and(isNull(rounds.winnerId), sql`${rounds.closesOn} < ${day}`))
		.all();
	for (const r of open) {
		const tally = voteTally(db, r.id);
		if (tally.length === 0) continue;
		const top = tally[0].votes;
		const leaders = tally.filter((t) => t.votes === top);
		if (top > 0 && leaders.length === 1) {
			db.update(rounds).set({ winnerId: leaders[0].candidateId }).where(eq(rounds.id, r.id)).run();
		}
	}
}

export function voteTally(db: DB, roundId: number) {
	const cands = db.select().from(candidates).where(eq(candidates.roundId, roundId)).all();
	const counts = db
		.select({ candidateId: votes.candidateId, n: count() })
		.from(votes)
		.where(eq(votes.roundId, roundId))
		.groupBy(votes.candidateId)
		.all();
	return cands
		.map((c) => ({ candidateId: c.id, name: c.name, votes: counts.find((x) => x.candidateId === c.id)?.n ?? 0 }))
		.sort((a, b) => b.votes - a.votes);
}

export function openRound(db: DB) {
	const day = today();
	return db
		.select()
		.from(rounds)
		.where(and(lte(rounds.opensOn, day), gte(rounds.closesOn, day)))
		.get();
}

export function vote(db: DB, memberId: number, candidateId: number) {
	const round = openRound(db);
	if (!round) throw new ClubError('Voting is closed right now.');
	const cand = db
		.select()
		.from(candidates)
		.where(and(eq(candidates.id, candidateId), eq(candidates.roundId, round.id)))
		.get();
	if (!cand) throw new ClubError('That flavour is not on this month’s ballot.');
	db.transaction((tx) => {
		const already = tx
			.select()
			.from(votes)
			.where(and(eq(votes.roundId, round.id), eq(votes.memberId, memberId)))
			.get();
		if (already) throw new ClubError('You already voted this round.');
		tx.insert(votes).values({ roundId: round.id, memberId, candidateId }).run();
		credit(tx, memberId, EARN.vote, 'vote', `Voted for ${cand.name}`);
	});
}

/* ---------- Lucky Cupboard ---------- */

export type Capsule = { type: 'round'; colour: string } | { type: 'special'; shape: string };

export function playsToday(db: DB, memberId: number) {
	const row = db
		.select({ n: count() })
		.from(clawPlays)
		.where(and(eq(clawPlays.memberId, memberId), eq(clawPlays.day, today())))
		.get();
	return row?.n ?? 0;
}

function roll(): { capsule: Capsule; prize: Prize; label: string; key: string } {
	if (randomInt(1_000_000) < SPECIAL_ODDS * 1_000_000) {
		const shape = SPECIAL_SHAPES[randomInt(SPECIAL_SHAPES.length)];
		return {
			capsule: { type: 'special', shape },
			prize: { kind: 'voucher', reward: shape },
			label: REWARDS[shape].title,
			key: shape
		};
	}
	const total = ROUND_PRIZES.reduce((s, p) => s + p.weight, 0);
	let r = randomInt(total);
	const pick = ROUND_PRIZES.find((p) => (r -= p.weight) < 0)!;
	const colour = CAPSULE_COLOURS[randomInt(CAPSULE_COLOURS.length)];
	const key =
		pick.prize.kind === 'crumbs' ? `crumbs${pick.prize.amount}` : pick.prize.kind === 'voucher' ? pick.prize.reward : 'double';
	return { capsule: { type: 'round', colour }, prize: pick.prize, label: pick.label, key };
}

export function play(db: DB, memberId: number) {
	return db.transaction((tx) => {
		const day = today();
		const played = tx
			.select({ n: count() })
			.from(clawPlays)
			.where(and(eq(clawPlays.memberId, memberId), eq(clawPlays.day, day)))
			.get();
		const free = (played?.n ?? 0) === 0;
		if (!free) spend(tx, memberId, PLAY_COST, 'cupboard', 'A turn at the Lucky Cupboard');

		const result = roll();
		let voucher: { code: string; expiresAt: string } | null = null;
		if (result.prize.kind === 'crumbs') {
			credit(tx, memberId, result.prize.amount, 'cupboard', `Found ${result.prize.amount} Crumbs in a capsule`);
		} else if (result.prize.kind === 'voucher') {
			voucher = issueVoucher(tx, memberId, result.prize.reward, 'cupboard', inDays(CUPBOARD_DAYS));
		} else {
			tx.insert(boosts).values({ memberId }).run();
		}
		tx.insert(clawPlays)
			.values({ memberId, day, free, capsule: JSON.stringify(result.capsule), prizeKey: result.key })
			.run();

		return {
			free,
			capsule: result.capsule,
			prize: result.prize,
			label: result.label,
			voucher,
			balance: balance(tx, memberId)
		};
	});
}

export function pendingBoosts(db: DB, memberId: number) {
	const row = db
		.select({ n: count() })
		.from(boosts)
		.where(and(eq(boosts.memberId, memberId), isNull(boosts.usedOnPurchase)))
		.get();
	return row?.n ?? 0;
}
