import { redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.ts';
import { balance, ensureBirthdayVoucher } from '#lib/server/club.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	const m = locals.member;
	if (!m) redirect(303, '/join');
	ensureBirthdayVoucher(db, m.id, m.birthday);
	return {
		member: { id: m.id, name: m.name, icon: m.icon, cardCode: m.cardCode },
		balance: balance(db, m.id)
	};
};
