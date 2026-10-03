import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { lt, sql } from 'drizzle-orm';
import * as schema from './schema.ts';
import { DATABASE_URL, DATABASE_AUTH_TOKEN } from '$app/env/private';
import { seed } from './seed.ts';

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

// A plain path means a local SQLite file; Turso URLs (libsql://...) need DATABASE_AUTH_TOKEN.
const url = /^[a-z]+:/.test(DATABASE_URL) ? DATABASE_URL : `file:${DATABASE_URL}`;
const client = createClient({ url, authToken: DATABASE_AUTH_TOKEN || undefined });

export const db = drizzle(client, { schema });
export type DB = typeof db;

// Migrations are bundled into the build, since serverless hosts don't ship the drizzle/ folder.
const files = import.meta.glob('../../../../drizzle/*.sql', { query: '?raw', import: 'default', eager: true }) as Record<
	string,
	string
>;
const migrations = Object.entries(files)
	.map(([path, text]) => ({ tag: path.split('/').pop()!.replace(/\.sql$/, ''), text }))
	.sort((a, b) => a.tag.localeCompare(b.tag));

async function migrate() {
	await db.run(sql`CREATE TABLE IF NOT EXISTS _crumb_migrations (tag text PRIMARY KEY)`);
	const done = new Set((await db.all<{ tag: string }>(sql`SELECT tag FROM _crumb_migrations`)).map((r) => r.tag));
	for (const m of migrations) {
		if (done.has(m.tag)) continue;
		// databases made before this migrator already have the first migration's tables
		const existing = await db.all(sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'members'`);
		if (m.tag.startsWith('0000') && existing.length) {
			await db.run(sql`INSERT INTO _crumb_migrations (tag) VALUES (${m.tag})`);
			continue;
		}
		const statements = m.text.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean);
		await client.batch([...statements, { sql: 'INSERT INTO _crumb_migrations (tag) VALUES (?)', args: [m.tag] }], 'write');
	}
}

let readyPromise: Promise<void> | null = null;

// Run once per server instance before the first request touches the database.
export function ready() {
	readyPromise ??= (async () => {
		await migrate();
		await seed(db);
		await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date().toISOString())).run();
	})().catch((e) => {
		readyPromise = null;
		throw e;
	});
	return readyPromise;
}
