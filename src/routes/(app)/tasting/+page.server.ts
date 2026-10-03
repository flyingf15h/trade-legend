import { fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { fridgeNotes, members } from '#lib/server/db/schema.ts';
import { ClubError, vote } from '#lib/server/club.ts';
import { archive, ballot } from '#lib/server/flavours.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const m = locals.member!;
	return {
		ballot: ballot(db, m.id),
		archive: archive(db),
		fridge: db
			.select({ id: fridgeNotes.id, text: fridgeNotes.text, name: members.name })
			.from(fridgeNotes)
			.innerJoin(members, eq(members.id, fridgeNotes.memberId))
			.where(eq(fridgeNotes.status, 'approved'))
			.orderBy(desc(fridgeNotes.id))
			.limit(8)
			.all(),
		myPending: db
			.select({ id: fridgeNotes.id })
			.from(fridgeNotes)
			.where(and(eq(fridgeNotes.memberId, m.id), eq(fridgeNotes.status, 'pending')))
			.all().length
	};
};

export const actions: Actions = {
	vote: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('candidate'));
		try {
			vote(db, locals.member!.id, id);
		} catch (e) {
			if (e instanceof ClubError) return fail(400, { error: e.message });
			throw e;
		}
		return { voted: true };
	},
	note: async ({ request, locals }) => {
		const text = String((await request.formData()).get('text') ?? '').trim();
		if (text.length < 3) return fail(400, { noteError: 'Write Grandma a few words first.' });
		if (text.length > 200) return fail(400, { noteError: 'Keep it short enough for the fridge (200 letters).' });
		db.insert(fridgeNotes).values({ memberId: locals.member!.id, text }).run();
		return { noted: true };
	}
};
