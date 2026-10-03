import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { members } from '#lib/server/db/schema.ts';
import { checkCode, sendCode, signIn } from '#lib/server/auth.ts';
import { ClubError, linkReferral } from '#lib/server/club.ts';
import { cardCode, referralCode } from '#lib/server/codes.ts';
import type { Actions, PageServerLoad } from './$types';

type Pending = { phone: string; name?: string; email?: string | null; icon?: string; marketing?: boolean };

function pending(cookies: import('@sveltejs/kit').Cookies): Pending | null {
	try {
		const p = JSON.parse(cookies.get('cc_pending') ?? 'null');
		return p && typeof p.phone === 'string' ? p : null;
	} catch {
		return null;
	}
}

export const load: PageServerLoad = ({ cookies }) => {
	const p = pending(cookies);
	if (!p) redirect(303, '/join');
	return { phone: p.phone, demoCode: cookies.get('cc_demo_code') ?? null };
};

export const actions: Actions = {
	verify: async ({ request, cookies }) => {
		const p = pending(cookies);
		if (!p) redirect(303, '/join');
		const code = String((await request.formData()).get('code') ?? '');
		try {
			checkCode(db, p.phone, code);
		} catch (e) {
			if (e instanceof ClubError) return fail(400, { error: e.message });
			throw e;
		}
		cookies.delete('cc_pending', { path: '/' });
		cookies.delete('cc_demo_code', { path: '/join' });

		const existing = db.select().from(members).where(eq(members.phone, p.phone)).get();
		if (existing) {
			signIn(db, cookies, existing.id);
			redirect(303, '/kitchen');
		}
		if (!p.name) redirect(303, '/join');

		const ref = cookies.get('cc_ref');
		const visit = cookies.get('cc_visit');
		const member = db.transaction((tx) => {
			const m = tx
				.insert(members)
				.values({
					phone: p.phone,
					name: p.name!,
					email: p.email || null,
					icon: p.icon ?? 'croissant',
					marketingOptIn: !!p.marketing,
					cardCode: cardCode(),
					referralCode: referralCode()
				})
				.returning()
				.get();
			linkReferral(tx, m.id, ref, visit);
			return m;
		});
		cookies.delete('cc_ref', { path: '/' });
		cookies.delete('cc_visit', { path: '/' });
		signIn(db, cookies, member.id);
		redirect(303, '/welcome');
	},

	resend: async ({ cookies }) => {
		const p = pending(cookies);
		if (!p) redirect(303, '/join');
		try {
			const code = sendCode(db, p.phone);
			if (code) cookies.set('cc_demo_code', code, { path: '/join', sameSite: 'lax', maxAge: 900 });
		} catch (e) {
			if (e instanceof ClubError) return fail(400, { error: e.message });
			throw e;
		}
		return { resent: true };
	}
};
