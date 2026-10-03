import { randomBytes, randomInt } from 'node:crypto';

// No 0/O or 1/I so codes read cleanly off a phone screen at the counter.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function code(len: number) {
	let s = '';
	for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
	return s;
}

export const cardCode = () => 'CRUMB-' + code(6);
export const voucherCode = () => 'TREAT-' + code(6);
export const referralCode = () => code(6);
export const otp = () => String(randomInt(1_000_000)).padStart(6, '0');
export const token = () => randomBytes(24).toString('base64url');
