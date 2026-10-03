import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'A local SQLite file path, or a Turso libsql:// URL.' },
	DATABASE_AUTH_TOKEN: {
		description: 'Turso auth token. Leave empty for a local file.',
		schema: (v) => v ?? ''
	},
	OTP_MODE: {
		description: '"demo" shows the sign-in code on screen instead of texting it.',
		schema: (v) => (v === 'sms' ? 'sms' : 'demo')
	},
	STAFF_PIN: {
		description: 'PIN for the staff counter screen.',
		schema: (v) => v || '1234'
	}
});
