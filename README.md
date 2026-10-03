# crumb club

Loyalty app for Grandma's Bakery. Customers scan a QR code at the counter, join with their phone number, and earn **Crumbs** (loyalty points) for shopping, voting on the flavour of the month, posting a review and bringing friends. They spend Crumbs on the Treat Shelf, and get one free turn a day at Grandma's Lucky Cupboard, a capsule claw machine that always pays out.

Built with SvelteKit 3 (Svelte 5, TypeScript), SQLite through better-sqlite3 and Drizzle, and plain CSS.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. The database (`local.db`) is created, migrated and filled with sample data on first start. Delete it to start over.

- **Demo customer:** sign in with `519 555 0123` to visit as Sophie. Sign-in codes are shown on screen in demo mode.
- **Staff counter:** http://localhost:5173/staff, PIN `1234` (set `STAFF_PIN` in `.env`).

## What's in it

| Page | What customers do |
|---|---|
| Join | Phone (verified with a code), first name, optional email, a profile friend. Marketing is a separate, unticked opt-in |
| Grandma's Kitchen | Membership card with QR, balance, progress to the next treat, daily play, flavour of the month |
| The Treat Shelf | Trade Crumbs for a voucher, with terms and expiry shown before confirming |
| My Recipe Book | Vouchers with scannable codes, and a receipt-style Crumb history |
| The Tasting Table | Vote once per round (1st to 20th) for next month's flavour, the recipe archive, notes on the fridge |
| Lucky Cupboard | Umamusume-style claw machine: hold the button to slide the claw, let go to drop. It always grabs a capsule. One free turn a day, then 10 Crumbs, and the claw gets quicker each turn |
| Invite a Neighbour | Personal link and QR, referral progress (invited, joined, first visit done) |
| Profile | Name, email, friend, birthday (for a birthday-week pastry), review link |

Staff can scan a card or voucher (camera scanning where the browser supports `BarcodeDetector`), award Crumbs for a purchase, process returns, mark vouchers used, approve reviews and fridge notes, break ties and set up next month's ballot.

## Earning and spending

All the numbers live in `src/lib/rewards.ts`:

- $1 = 5 Crumbs, on the amount paid after discounts, before tax and tip. Fractions are kept, so $7.35 earns 36.75
- Voting 100, review 250, referral 150 for the referrer and 50 for the friend after a first purchase of $5 or more (up to 5 a month)
- Treat Shelf: free drink or 10% off (100), 15% off (120), free cookie (150), BOGO (200), free pastry (250)
- Cupboard: 1 in 10 capsules is shaped like a bakery item and holds that item for free. The rest hold 10/15/20/50 Crumbs, a free sample, double Crumbs on the next purchase, or 10/12/15% off. The odds are shown in the app

The cupboard's prize is rolled on the server when the turn starts, so refreshing mid-animation can't reroll it.

## Swapping in the hand-drawn art

Every drawing is a placeholder SVG in `static/art/`, listed in `src/lib/art.ts`. Drop the hand-drawn files in `static/art/` and point the matching entry at them. The cupboard frame needs to keep its window and prize chute in the same place (the coordinates are noted in `art.ts`), since the claw and capsules sit behind those holes.

## Database

The schema is in `src/lib/server/db/schema.ts`. After changing it, run `DATABASE_URL=local.db npm run db:generate` to write a migration; it's applied automatically on start.
