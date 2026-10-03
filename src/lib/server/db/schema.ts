import { integer, sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

const id = () => integer('id').primaryKey({ autoIncrement: true });
const createdAt = () =>
	text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString());

export const members = sqliteTable('members', {
	id: id(),
	phone: text('phone').notNull().unique(),
	name: text('name').notNull(),
	email: text('email'),
	marketingOptIn: integer('marketing_opt_in', { mode: 'boolean' }).notNull().default(false),
	icon: text('icon').notNull().default('croissant'),
	// MM-DD, optional, used for the birthday-week pastry
	birthday: text('birthday'),
	// printed in the membership QR code; staff scan it at the counter
	cardCode: text('card_code').notNull().unique(),
	referralCode: text('referral_code').notNull().unique(),
	referredBy: integer('referred_by'),
	createdAt: createdAt()
});

// Points are stored in hundredths of a Crumb so a $3.07 purchase still earns 15.35 Crumbs.
export const ledger = sqliteTable(
	'ledger',
	{
		id: id(),
		memberId: integer('member_id').notNull(),
		centi: integer('centi').notNull(),
		kind: text('kind').notNull(),
		note: text('note').notNull(),
		purchaseId: integer('purchase_id'),
		createdAt: createdAt()
	},
	(t) => [index('ledger_member').on(t.memberId)]
);

export const purchases = sqliteTable('purchases', {
	id: id(),
	memberId: integer('member_id').notNull(),
	eligibleCents: integer('eligible_cents').notNull(),
	description: text('description'),
	doubled: integer('doubled', { mode: 'boolean' }).notNull().default(false),
	returned: integer('returned', { mode: 'boolean' }).notNull().default(false),
	createdAt: createdAt()
});

export const vouchers = sqliteTable(
	'vouchers',
	{
		id: id(),
		memberId: integer('member_id').notNull(),
		code: text('code').notNull().unique(),
		rewardKey: text('reward_key').notNull(),
		source: text('source').notNull(), // shelf | cupboard | birthday
		status: text('status').notNull().default('ready'), // ready | used | refunded
		expiresAt: text('expires_at').notNull(),
		usedAt: text('used_at'),
		createdAt: createdAt()
	},
	(t) => [index('vouchers_member').on(t.memberId)]
);

export const otpCodes = sqliteTable('otp_codes', {
	phone: text('phone').primaryKey(),
	code: text('code').notNull(),
	attempts: integer('attempts').notNull().default(0),
	expiresAt: text('expires_at').notNull()
});

export const sessions = sqliteTable('sessions', {
	token: text('token').primaryKey(),
	memberId: integer('member_id'), // null for staff sessions
	staff: integer('staff', { mode: 'boolean' }).notNull().default(false),
	expiresAt: text('expires_at').notNull()
});

export const rounds = sqliteTable('rounds', {
	id: id(),
	month: text('month').notNull().unique(), // YYYY-MM the winner goes on sale
	opensOn: text('opens_on').notNull(), // YYYY-MM-DD
	closesOn: text('closes_on').notNull(),
	winnerId: integer('winner_id')
});

export const candidates = sqliteTable('candidates', {
	id: id(),
	roundId: integer('round_id').notNull(),
	name: text('name').notNull(),
	dish: text('dish').notNull(),
	description: text('description').notNull(),
	ingredients: text('ingredients').notNull(),
	allergens: text('allergens').notNull(),
	art: text('art').notNull() // key into the art manifest
});

export const votes = sqliteTable(
	'votes',
	{
		id: id(),
		roundId: integer('round_id').notNull(),
		memberId: integer('member_id').notNull(),
		candidateId: integer('candidate_id').notNull(),
		createdAt: createdAt()
	},
	(t) => [uniqueIndex('one_vote').on(t.roundId, t.memberId)]
);

export const fridgeNotes = sqliteTable('fridge_notes', {
	id: id(),
	memberId: integer('member_id').notNull(),
	text: text('text').notNull(),
	status: text('status').notNull().default('pending'), // pending | approved | hidden
	createdAt: createdAt()
});

export const referrals = sqliteTable('referrals', {
	id: id(),
	referrerId: integer('referrer_id').notNull(),
	// set once the friend joins; before that the row just means someone opened the invite
	refereeId: integer('referee_id').unique(),
	visitorToken: text('visitor_token').unique(),
	status: text('status').notNull().default('invited'), // invited | joined | completed
	createdAt: createdAt(),
	completedAt: text('completed_at')
});

export const reviews = sqliteTable('reviews', {
	id: id(),
	memberId: integer('member_id').notNull().unique(), // one review bonus per member
	link: text('link').notNull(),
	status: text('status').notNull().default('pending'), // pending | approved | rejected
	createdAt: createdAt()
});

export const clawPlays = sqliteTable(
	'claw_plays',
	{
		id: id(),
		memberId: integer('member_id').notNull(),
		day: text('day').notNull(), // YYYY-MM-DD in bakery time
		free: integer('free', { mode: 'boolean' }).notNull(),
		capsule: text('capsule').notNull(),
		prizeKey: text('prize_key').notNull(),
		voucherId: integer('voucher_id'),
		createdAt: createdAt()
	},
	(t) => [index('plays_member_day').on(t.memberId, t.day)]
);

// Claw prize "double Crumbs on your next purchase", consumed by the next recorded purchase
export const boosts = sqliteTable('boosts', {
	id: id(),
	memberId: integer('member_id').notNull(),
	usedOnPurchase: integer('used_on_purchase'),
	createdAt: createdAt()
});

export type Member = typeof members.$inferSelect;
