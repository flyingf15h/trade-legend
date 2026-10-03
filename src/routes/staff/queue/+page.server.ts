import { fail } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { candidates, fridgeNotes, members, reviews, rounds } from '#lib/server/db/schema.ts';
import { ClubError, approveReview, voteTally } from '#lib/server/club.ts';
import { awaitingGrandma } from '#lib/server/flavours.ts';
import { nextMonth, monthOf, today } from '#lib/server/time.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const upcoming = nextMonth(monthOf(today()));
	const current = db.select().from(rounds).orderBy(desc(rounds.month)).limit(1).get();
	return {
		reviews: db
			.select({ id: reviews.id, link: reviews.link, name: members.name, createdAt: reviews.createdAt })
			.from(reviews)
			.innerJoin(members, eq(members.id, reviews.memberId))
			.where(eq(reviews.status, 'pending'))
			.orderBy(asc(reviews.id))
			.all(),
		notes: db
			.select({ id: fridgeNotes.id, text: fridgeNotes.text, name: members.name })
			.from(fridgeNotes)
			.innerJoin(members, eq(members.id, fridgeNotes.memberId))
			.where(eq(fridgeNotes.status, 'pending'))
			.orderBy(asc(fridgeNotes.id))
			.all(),
		ties: awaitingGrandma(db).map((r) => ({ ...r, tally: voteTally(db, r.id) })),
		latest: current ? { ...current, tally: voteTally(db, current.id) } : null,
		// the next ballot Grandma could set up: the month after the latest round
		nextBallotMonth: current && current.month >= upcoming ? nextMonth(current.month) : upcoming
	};
};

export const actions: Actions = {
	approveReview: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		try {
			approveReview(db, id);
		} catch (e) {
			if (e instanceof ClubError) return fail(400, { error: e.message });
			throw e;
		}
	},
	rejectReview: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		db.update(reviews).set({ status: 'rejected' }).where(eq(reviews.id, id)).run();
	},
	note: async ({ request }) => {
		const f = await request.formData();
		const status = f.get('status') === 'approved' ? 'approved' : 'hidden';
		db.update(fridgeNotes).set({ status }).where(eq(fridgeNotes.id, Number(f.get('id')))).run();
	},
	pickWinner: async ({ request }) => {
		const f = await request.formData();
		const roundId = Number(f.get('round'));
		const candidateId = Number(f.get('candidate'));
		const c = db.select().from(candidates).where(eq(candidates.id, candidateId)).get();
		if (!c || c.roundId !== roundId) return fail(400, { error: 'Pick one of the tied flavours.' });
		db.update(rounds).set({ winnerId: candidateId }).where(eq(rounds.id, roundId)).run();
	},
	newRound: async ({ request }) => {
		const f = await request.formData();
		const month = String(f.get('month'));
		if (!/^\d{4}-\d{2}$/.test(month)) return fail(400, { error: 'Bad month.' });
		const cands = [0, 1, 2].map((i) => ({
			name: String(f.get(`name${i}`) ?? '').trim(),
			dish: String(f.get(`dish${i}`) ?? '').trim(),
			description: String(f.get(`desc${i}`) ?? '').trim(),
			ingredients: String(f.get(`ing${i}`) ?? '').trim(),
			allergens: String(f.get(`all${i}`) ?? '').trim(),
			art: String(f.get(`art${i}`) ?? 'cookie')
		}));
		if (cands.some((c) => !c.name || !c.dish || !c.allergens)) return fail(400, { error: 'Each flavour needs a name, a dish and its allergens.' });
		// voting runs from the 1st to the 20th of the month before the flavour goes on sale
		const [y, m] = month.split('-').map(Number);
		const votingMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
		try {
			db.transaction((tx) => {
				const r = tx.insert(rounds).values({ month, opensOn: `${votingMonth}-01`, closesOn: `${votingMonth}-20` }).returning().get();
				for (const c of cands) tx.insert(candidates).values({ ...c, roundId: r.id }).run();
			});
		} catch {
			return fail(400, { error: 'There’s already a ballot for that month.' });
		}
		return { created: month };
	}
};
