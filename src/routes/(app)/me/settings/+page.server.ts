import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { members, reviews } from '#lib/server/db/schema.ts';
import { ClubError, submitReview } from '#lib/server/club.ts';
import { ICONS } from '#lib/rewards.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const m = locals.member!;
	return {
		profile: { name: m.name, email: m.email, phone: m.phone, birthday: m.birthday, marketing: m.marketingOptIn, since: m.createdAt },
		review: db.select({ status: reviews.status, link: reviews.link }).from(reviews).where(eq(reviews.memberId, m.id)).get() ?? null
	};
};

export const actions: Actions = {
	profile: async ({ request, locals }) => {
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		const email = String(f.get('email') ?? '').trim();
		const icon = String(f.get('icon') ?? '');
		const month = String(f.get('bmonth') ?? '');
		const day = String(f.get('bday') ?? '');
		if (!name) return fail(400, { profileError: 'Grandma needs something to call you.' });
		if (email && !/^\S+@\S+\.\S+$/.test(email)) return fail(400, { profileError: 'That email looks a little off.' });
		if (!ICONS.some((i) => i.key === icon)) return fail(400, { profileError: 'Pick a little friend.' });
		if (f.get('marketing') === 'on' && !email) return fail(400, { profileError: 'Add your email to subscribe to updates.' });
		let birthday: string | null = locals.member!.birthday;
		// the birthday can only be set once, so nobody moves it around for extra pastries
		if (!birthday && month && day) {
			const mm = Number(month);
			const dd = Number(day);
			const max = new Date(Date.UTC(2024, mm, 0)).getUTCDate();
			if (!(mm >= 1 && mm <= 12 && dd >= 1 && dd <= max)) return fail(400, { profileError: 'That birthday doesn’t look right.' });
			birthday = `${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
		}
		db.update(members)
			.set({ name, email: email || null, icon, birthday, marketingOptIn: f.get('marketing') === 'on' })
			.where(eq(members.id, locals.member!.id))
			.run();
		return { saved: true };
	},
	review: async ({ request, locals }) => {
		const link = String((await request.formData()).get('link') ?? '');
		try {
			submitReview(db, locals.member!.id, link);
		} catch (e) {
			if (e instanceof ClubError) return fail(400, { reviewError: e.message });
			throw e;
		}
		return { reviewed: true };
	}
};
