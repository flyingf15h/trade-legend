import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'Path to the SQLite database file.' },
	OTP_MODE: {
		description: '"demo" shows the sign-in code on screen instead of texting it.',
		schema: (v) => (v === 'sms' ? 'sms' : 'demo')
	},
	STAFF_PIN: {
		description: 'PIN for the staff counter screen.',
		schema: (v) => v || '1234'
	}
});
