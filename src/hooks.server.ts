import type { Handle } from '@sveltejs/kit/hooks';
import { db } from '#lib/server/db/index.ts';
import { currentMember, isStaff, pruneSessions } from '#lib/server/auth.ts';

pruneSessions(db);

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.member = currentMember(db, event.cookies);
	event.locals.staff = isStaff(db, event.cookies);
	return resolve(event);
};
