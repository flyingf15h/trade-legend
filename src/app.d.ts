// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			member: import('#lib/server/db/schema.ts').Member | null;
			staff: boolean;
		}
	}
}

export {};
