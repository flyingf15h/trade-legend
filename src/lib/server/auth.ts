import type { Cookies } from '@sveltejs/kit';
import { and, eq, gt, lt } from 'drizzle-orm';
import { OTP_MODE } from '$app/env/private';
import type { DB } from './db';
import { members, otpCodes, sessions } from './db/schema';
import { otp, token } from './codes';
import { ClubError } from './club';

const SESSION_DAYS = 60;
const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export function normalizePhone(raw: string) {
	let d = raw.replace(/\D/g, '');
	if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
	if (d.length !== 10) throw new ClubError('Enter a 10-digit phone number.');
	return d;
}

// Demo mode returns the code so the page can show it. To send real texts, call your SMS
// provider (Twilio etc.) here when OTP_MODE is "sms" and return null.
export function sendCode(db: DB, phone: string) {
	const code = otp();
	const expiresAt = new Date(Date.now() + CODE_MINUTES * 60_000).toISOString();
	db.insert(otpCodes)
		.values({ phone, code, expiresAt })
		.onConflictDoUpdate({ target: otpCodes.phone, set: { code, expiresAt, attempts: 0 } })
		.run();
	if (OTP_MODE === 'demo') {
		console.log(`[crumb club] sign-in code for ${phone}: ${code}`);
		return code;
	}
	throw new ClubError('Text messages are not set up yet. Ask at the counter!');
}

export function checkCode(db: DB, phone: string, code: string) {
	const row = db.select().from(otpCodes).where(eq(otpCodes.phone, phone)).get();
	if (!row || row.expiresAt < new Date().toISOString()) throw new ClubError('That code has expired. Send a new one.');
	if (row.attempts >= MAX_ATTEMPTS) throw new ClubError('Too many tries. Send a new code.');
	if (row.code !== code.replace(/\D/g, '')) {
		db.update(otpCodes).set({ attempts: row.attempts + 1 }).where(eq(otpCodes.phone, phone)).run();
		throw new ClubError('That code doesn’t match. Try again?');
	}
	db.delete(otpCodes).where(eq(otpCodes.phone, phone)).run();
}

const COOKIE = 'cc_session';
const STAFF_COOKIE = 'cc_staff';

function startSession(db: DB, cookies: Cookies, name: string, memberId: number | null, days: number) {
	const t = token();
	db.insert(sessions)
		.values({ token: t, memberId, staff: memberId === null, expiresAt: new Date(Date.now() + days * 86400_000).toISOString() })
		.run();
	cookies.set(name, t, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: days * 86400 });
}

export function signIn(db: DB, cookies: Cookies, memberId: number) {
	startSession(db, cookies, COOKIE, memberId, SESSION_DAYS);
}

export function staffSignIn(db: DB, cookies: Cookies) {
	startSession(db, cookies, STAFF_COOKIE, null, 1);
}

export function signOut(db: DB, cookies: Cookies, staff = false) {
	const name = staff ? STAFF_COOKIE : COOKIE;
	const t = cookies.get(name);
	if (t) db.delete(sessions).where(eq(sessions.token, t)).run();
	cookies.delete(name, { path: '/' });
}

export function currentMember(db: DB, cookies: Cookies) {
	const t = cookies.get(COOKIE);
	if (!t) return null;
	const now = new Date().toISOString();
	const s = db
		.select()
		.from(sessions)
		.where(and(eq(sessions.token, t), eq(sessions.staff, false), gt(sessions.expiresAt, now)))
		.get();
	if (!s?.memberId) return null;
	return db.select().from(members).where(eq(members.id, s.memberId)).get() ?? null;
}

export function isStaff(db: DB, cookies: Cookies) {
	const t = cookies.get(STAFF_COOKIE);
	if (!t) return false;
	const now = new Date().toISOString();
	return !!db
		.select()
		.from(sessions)
		.where(and(eq(sessions.token, t), eq(sessions.staff, true), gt(sessions.expiresAt, now)))
		.get();
}

export function pruneSessions(db: DB) {
	db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString())).run();
}
