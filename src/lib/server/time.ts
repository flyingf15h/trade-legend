// Grandma's day starts and ends in Waterloo, not UTC.
const TZ = 'America/Toronto';

export function today(now = new Date()) {
	return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now); // YYYY-MM-DD
}

export function addDays(day: string, n: number) {
	const d = new Date(day + 'T12:00:00Z');
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

export function monthOf(day: string) {
	return day.slice(0, 7);
}

export function nextMonth(month: string) {
	const [y, m] = month.split('-').map(Number);
	return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

export function inDays(n: number) {
	return new Date(Date.now() + n * 86400_000).toISOString();
}
