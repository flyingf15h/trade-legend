CREATE TABLE `boosts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`used_on_purchase` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `candidates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`round_id` integer NOT NULL,
	`name` text NOT NULL,
	`dish` text NOT NULL,
	`description` text NOT NULL,
	`ingredients` text NOT NULL,
	`allergens` text NOT NULL,
	`art` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `claw_plays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`day` text NOT NULL,
	`free` integer NOT NULL,
	`capsule` text NOT NULL,
	`prize_key` text NOT NULL,
	`voucher_id` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `plays_member_day` ON `claw_plays` (`member_id`,`day`);--> statement-breakpoint
CREATE TABLE `fridge_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`text` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`centi` integer NOT NULL,
	`kind` text NOT NULL,
	`note` text NOT NULL,
	`purchase_id` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ledger_member` ON `ledger` (`member_id`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`phone` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`marketing_opt_in` integer DEFAULT false NOT NULL,
	`icon` text DEFAULT 'croissant' NOT NULL,
	`birthday` text,
	`card_code` text NOT NULL,
	`referral_code` text NOT NULL,
	`referred_by` integer,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_phone_unique` ON `members` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_card_code_unique` ON `members` (`card_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_referral_code_unique` ON `members` (`referral_code`);--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`phone` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`eligible_cents` integer NOT NULL,
	`description` text,
	`doubled` integer DEFAULT false NOT NULL,
	`returned` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`referrer_id` integer NOT NULL,
	`referee_id` integer,
	`visitor_token` text,
	`status` text DEFAULT 'invited' NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referrals_referee_id_unique` ON `referrals` (`referee_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `referrals_visitor_token_unique` ON `referrals` (`visitor_token`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`link` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_member_id_unique` ON `reviews` (`member_id`);--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`month` text NOT NULL,
	`opens_on` text NOT NULL,
	`closes_on` text NOT NULL,
	`winner_id` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rounds_month_unique` ON `rounds` (`month`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`member_id` integer,
	`staff` integer DEFAULT false NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`round_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`candidate_id` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_vote` ON `votes` (`round_id`,`member_id`);--> statement-breakpoint
CREATE TABLE `vouchers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`code` text NOT NULL,
	`reward_key` text NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'ready' NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vouchers_code_unique` ON `vouchers` (`code`);--> statement-breakpoint
CREATE INDEX `vouchers_member` ON `vouchers` (`member_id`);