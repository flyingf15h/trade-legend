import type { Handle } from '@sveltejs/kit/hooks';
import { db, ready } from '#lib/server/db/index.ts';
import { currentMember, isStaff } from '#lib/server/auth.ts';

export const handle: Handle = async ({ event, resolve }) => {
	await ready();
	event.locals.member = await currentMember(db, event.cookies);
	event.locals.staff = await isStaff(db, event.cookies);
	return resolve(event);
};
