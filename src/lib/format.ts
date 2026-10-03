export function monthName(month: string) {
	const [y, m] = month.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, 15)).toLocaleString('en-CA', { month: 'long', timeZone: 'UTC' });
}

export function shortDate(iso: string) {
	const d = iso.length === 10 ? new Date(iso + 'T12:00:00Z') : new Date(iso);
	return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'America/Toronto' });
}

export function money(cents: number) {
	return '$' + (cents / 100).toFixed(2);
}

export function prettyPhone(p: string) {
	const d = p.replace(/\D/g, '').slice(-10);
	return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}
