import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { members } from '#lib/server/db/schema.ts';
import { normalizePhone, sendCode } from '#lib/server/auth.ts';
import { ClubError } from '#lib/server/club.ts';
import { ICONS } from '#lib/rewards.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, cookies, url }) => {
	if (locals.member) redirect(303, '/kitchen');
	const ref = cookies.get('cc_ref');
	const referrer = ref ? db.select({ name: members.name }).from(members).where(eq(members.referralCode, ref)).get() : undefined;
	return { referrer: referrer?.name ?? null, mode: url.searchParams.get('mode') === 'back' ? 'back' : 'join' };
};

function startVerify(cookies: import('@sveltejs/kit').Cookies, pending: Record<string, unknown>, code: string | null) {
	cookies.set('cc_pending', JSON.stringify(pending), { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 900 });
	if (code) cookies.set('cc_demo_code', code, { path: '/join', sameSite: 'lax', maxAge: 900 });
	redirect(303, '/join/verify');
}

export const actions: Actions = {
	join: async ({ request, cookies }) => {
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		const email = String(f.get('email') ?? '').trim();
		const icon = String(f.get('icon') ?? 'croissant');
		const values = { name, email, phone: String(f.get('phone') ?? ''), icon, marketing: f.get('marketing') === 'on' };
		if (!name) return fail(400, { ...values, error: 'Tell Grandma what to call you.' });
		if (email && !/^\S+@\S+\.\S+$/.test(email)) return fail(400, { ...values, error: 'That email looks a little off.' });
		if (values.marketing && !email) return fail(400, { ...values, error: 'Add your email to subscribe to updates.' });
		if (!ICONS.some((i) => i.key === icon)) return fail(400, { ...values, error: 'Pick a little friend.' });
		let phone: string;
		let code: string | null;
		try {
			phone = normalizePhone(values.phone);
			code = sendCode(db, phone);
		} catch (e) {
			if (e instanceof ClubError) return fail(400, { ...values, error: e.message });
			throw e;
		}
		startVerify(cookies, { phone, name, email: email || null, icon, marketing: values.marketing }, code);
	},

	back: async ({ request, cookies }) => {
		const f = await request.formData();
		const raw = String(f.get('phone') ?? '');
		let phone: string;
		let code: string | null;
		try {
			phone = normalizePhone(raw);
			const m = db.select({ id: members.id }).from(members).where(eq(members.phone, phone)).get();
			if (!m) return fail(400, { phone: raw, back: true, error: 'We don’t have that number yet. Join below and Grandma will save you a seat!' });
			code = sendCode(db, phone);
		} catch (e) {
			if (e instanceof ClubError) return fail(400, { phone: raw, back: true, error: e.message });
			throw e;
		}
		startVerify(cookies, { phone }, code);
	}
};
