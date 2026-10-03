import { error, json } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { ClubError, play } from '#lib/server/club.ts';
import type { RequestHandler } from './$types';

// The prize is decided here, before the claw moves, so refreshing mid-animation can't reroll it.
export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.member) error(401, 'Sign in first');
	try {
		return json(await play(db, locals.member.id));
	} catch (e) {
		if (e instanceof ClubError) return json({ error: e.message }, { status: 400 });
		throw e;
	}
};
