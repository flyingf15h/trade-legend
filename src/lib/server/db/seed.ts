import { count, eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { candidates, clawPlays, ledger, members, purchases, referrals, rounds, votes, vouchers } from './schema';
import { addDays, monthOf, nextMonth, today } from '../time';
import { cardCode, referralCode, voucherCode } from '../codes';

type Cand = { name: string; dish: string; description: string; ingredients: string; allergens: string; art: string };

const HISTORY: { offset: number; winner: number; cands: Cand[] }[] = [
	{
		offset: -3,
		winner: 0,
		cands: [
			{ name: 'Berry Patch', dish: 'Mixed berry pavlova', description: 'Crisp meringue, whipped cream and whatever berries the farm stand had that morning.', ingredients: 'Egg whites, sugar, cream, strawberries, blueberries, raspberries', allergens: 'Egg, milk', art: 'tart' },
			{ name: 'Lemon Cloud', dish: 'Lemon meringue tart', description: 'Sharp lemon curd under a toasted meringue hat.', ingredients: 'Butter, flour, lemons, eggs, sugar', allergens: 'Wheat, egg, milk', art: 'tart' },
			{ name: 'Sunday Morning', dish: 'Peach cobbler muffin', description: 'A muffin that tastes like the bottom of the cobbler dish.', ingredients: 'Flour, peaches, brown sugar, butter, cinnamon', allergens: 'Wheat, egg, milk', art: 'muffin' }
		]
	},
	{
		offset: -2,
		winner: 1,
		cands: [
			{ name: 'Porch Swing', dish: 'Iced honey latte', description: 'Espresso, local honey and cold milk.', ingredients: 'Espresso, milk, honey', allergens: 'Milk', art: 'coffee' },
			{ name: 'Peaches & Cream', dish: 'Peach cream puff', description: 'Choux pastry stuffed with peach diplomat cream.', ingredients: 'Flour, butter, eggs, peaches, cream, vanilla', allergens: 'Wheat, egg, milk', art: 'puff' },
			{ name: 'Strawberry Fields', dish: 'Strawberry shortcake', description: 'Biscuit shortcake, macerated berries, too much cream.', ingredients: 'Flour, butter, strawberries, cream, sugar', allergens: 'Wheat, milk', art: 'tart' }
		]
	},
	{
		offset: -1,
		winner: 2,
		cands: [
			{ name: 'Orchard Row', dish: 'Apple butter scone', description: 'Flaky scone with a ribbon of slow-cooked apple butter.', ingredients: 'Flour, butter, apples, cinnamon, cream', allergens: 'Wheat, milk', art: 'scone' },
			{ name: 'Back to School', dish: 'Brown butter cookie', description: 'Crisp edges, chewy middle, flaky salt.', ingredients: 'Flour, brown butter, sugar, chocolate, eggs', allergens: 'Wheat, egg, milk, soy', art: 'cookie' },
			{ name: 'Golden Hour', dish: 'Caramel custard pudding', description: 'Grandma’s purin with a cherry on top.', ingredients: 'Eggs, milk, sugar, vanilla, cherries', allergens: 'Egg, milk', art: 'pudding' }
		]
	},
	{
		offset: 0,
		winner: 0,
		cands: [
			{ name: 'Sweater Weather', dish: 'Pumpkin spice parfait', description: 'Spiced pumpkin mousse, gingersnap crumble and maple cream, layered in a jar.', ingredients: 'Pumpkin, cream, gingersnaps, maple syrup, cinnamon, nutmeg', allergens: 'Wheat, milk', art: 'parfait' },
			{ name: 'Sticky Fingers', dish: 'Maple pecan sticky bun', description: 'Soft dough rolled with cinnamon and baked in maple caramel.', ingredients: 'Flour, butter, maple syrup, pecans, cinnamon', allergens: 'Wheat, milk, egg, tree nuts', art: 'roll' },
			{ name: 'Chai Time', dish: 'Chai snickerdoodle', description: 'A snickerdoodle rolled in chai-spiced sugar.', ingredients: 'Flour, butter, sugar, cardamom, ginger, cinnamon', allergens: 'Wheat, egg, milk', art: 'cookie' }
		]
	}
];

const BALLOT: Cand[] = [
	{ name: 'Strawberry Sunday', dish: 'Strawberry shortcake parfait', description: 'Vanilla sponge, strawberry jam, fresh berries and whipped cream, stacked tall in a jar.', ingredients: 'Flour, eggs, sugar, strawberries, cream, vanilla', allergens: 'Wheat, egg, milk', art: 'parfait' },
	{ name: 'Grandpa’s Secret Stash', dish: 'Chocolate salted caramel cookie', description: 'Dark chocolate dough with a soft caramel centre and flaky salt. Grandpa kept these in a tin behind the flour.', ingredients: 'Flour, butter, dark chocolate, caramel, sea salt', allergens: 'Wheat, egg, milk, soy', art: 'cookie' },
	{ name: 'A Hug in a Bowl', dish: 'Cinnamon apple crumble parfait', description: 'Warm cinnamon apples, oat crumble and vanilla custard.', ingredients: 'Apples, oats, brown sugar, butter, cinnamon, eggs, milk', allergens: 'Wheat, egg, milk', art: 'crumble' }
];

const NEIGHBOURS = ['Margaret', 'Theo', 'Priya', 'Walter', 'June', 'Amir', 'Rosa', 'Ken', 'Bea', 'Luca', 'Hana', 'Otis'];

function monthShift(month: string, n: number) {
	let m = month;
	if (n > 0) for (let i = 0; i < n; i++) m = nextMonth(m);
	for (let i = 0; i > n; i--) {
		const [y, mm] = m.split('-').map(Number);
		m = mm === 1 ? `${y - 1}-12` : `${y}-${String(mm - 1).padStart(2, '0')}`;
	}
	return m;
}

function prevMonth(month: string) {
	return monthShift(month, -1);
}

export async function seed(db: LibSQLDatabase<typeof schema>) {
	const existing = await db.select({ n: count() }).from(rounds).get();
	if ((existing?.n ?? 0) > 0) return;

	const day = today();
	const thisMonth = monthOf(day);
	const ago = (days: number, hour = 15) => new Date(addDays(day, -days) + `T${String(hour).padStart(2, '0')}:20:00Z`).toISOString();

	await db.transaction(async (tx) => {
		const neighbourIds: number[] = [];
		for (const [i, name] of NEIGHBOURS.entries()) {
			neighbourIds.push(
				(
					await tx
					.insert(members)
					.values({
						phone: `519555${String(200 + i).padStart(4, '0')}`,
						name,
						icon: ['croissant', 'tart', 'loaf', 'cookie'][i % 4],
						cardCode: cardCode(),
						referralCode: referralCode(),
						createdAt: ago(120 - i)
					})
					.returning()
					.get()
				).id
			);
		}

		const sophie = await tx
			.insert(members)
			.values({
				phone: '5195550123',
				name: 'Sophie',
				email: 'sophie@example.com',
				icon: 'tart',
				cardCode: 'CRUMB-SOPH1E',
				referralCode: 'SOPHIE',
				createdAt: ago(70)
			})
			.returning()
			.get();

		// Past rounds with winners, plus this month's featured flavour.
		for (const h of HISTORY) {
			const month = monthShift(thisMonth, h.offset);
			const votingMonth = prevMonth(month);
			const round = await tx
				.insert(rounds)
				.values({ month, opensOn: `${votingMonth}-01`, closesOn: `${votingMonth}-20` })
				.returning()
				.get();
			const ids: number[] = [];
			for (const c of h.cands) ids.push((await tx.insert(candidates).values({ ...c, roundId: round.id }).returning().get()).id);
			for (const [i, mid] of neighbourIds.entries()) {
				// the winner gets about half the neighbourhood
				const pick = i % 2 === 0 ? h.winner : (h.winner + 1 + (i % 3 === 0 ? 1 : 0)) % 3;
				await tx.insert(votes).values({ roundId: round.id, memberId: mid, candidateId: ids[pick], createdAt: `${votingMonth}-0${(i % 9) + 1}T16:00:00.000Z` }).run();
			}
			await tx.update(rounds).set({ winnerId: ids[h.winner] }).where(eq(rounds.id, round.id)).run();
			if (h.offset === 0) {
				await tx.insert(votes).values({ roundId: round.id, memberId: sophie.id, candidateId: ids[0], createdAt: ago(25) }).run();
			}
		}

		// Next month's ballot, open from the 1st to the 20th of this month.
		const ballot = await tx
			.insert(rounds)
			.values({ month: nextMonth(thisMonth), opensOn: `${thisMonth}-01`, closesOn: `${thisMonth}-20` })
			.returning()
			.get();
		const ballotIds: number[] = [];
		for (const c of BALLOT) ballotIds.push((await tx.insert(candidates).values({ ...c, roundId: ballot.id }).returning().get()).id);
		for (const [i, mid] of neighbourIds.slice(0, 5).entries()) {
			await tx.insert(votes).values({ roundId: ballot.id, memberId: mid, candidateId: ballotIds[i % 3] }).run();
		}

		// Sophie's history so the demo account has something to look at.
		const buys: [number, number, string][] = [
			[68, 735, 'A latte and a croissant'],
			[52, 1240, 'Two cream puffs and a coffee'],
			[37, 560, 'A purin'],
			[21, 1890, 'A box of macarons'],
			[9, 980, 'A pumpkin parfait and a chai'],
			[3, 615, 'A latte']
		];
		for (const [d, cents, desc] of buys) {
			const p = await tx.insert(purchases).values({ memberId: sophie.id, eligibleCents: cents, description: desc, createdAt: ago(d) }).returning().get();
			await tx.insert(ledger).values({ memberId: sophie.id, centi: cents * 5, kind: 'purchase', note: `${desc} and a little happiness`, purchaseId: p.id, createdAt: ago(d) }).run();
		}
		await tx.insert(ledger).values({ memberId: sophie.id, centi: 10000, kind: 'vote', note: `Voted for ${HISTORY[3].cands[0].name}`, createdAt: ago(25) }).run();
		await tx.insert(ledger).values({ memberId: sophie.id, centi: 15000, kind: 'referral', note: 'Theo came by for their first visit', createdAt: ago(30) }).run();
		await tx.insert(referrals).values({ referrerId: sophie.id, refereeId: neighbourIds[1], status: 'completed', createdAt: ago(33), completedAt: ago(30) }).run();
		await tx.insert(referrals).values({ referrerId: sophie.id, refereeId: neighbourIds[4], status: 'joined', createdAt: ago(6) }).run();
		await tx.insert(referrals).values({ referrerId: sophie.id, visitorToken: 'seed-invite', status: 'invited', createdAt: ago(2) }).run();

		await tx.insert(ledger).values({ memberId: sophie.id, centi: -10000, kind: 'redeem', note: 'Traded for: Free drink', createdAt: ago(20) }).run();
		await tx.insert(ledger).values({ memberId: sophie.id, centi: -25000, kind: 'redeem', note: 'Traded for: Free pastry', createdAt: ago(8) }).run();
		await tx.insert(vouchers).values({ memberId: sophie.id, code: voucherCode(), rewardKey: 'pastry', source: 'shelf', status: 'used', expiresAt: ago(-52), usedAt: ago(8), createdAt: ago(8) }).run();
		await tx.insert(vouchers).values({ memberId: sophie.id, code: voucherCode(), rewardKey: 'drink', source: 'shelf', status: 'used', expiresAt: ago(-40), usedAt: ago(19), createdAt: ago(20) }).run();

		await tx.insert(ledger).values({ memberId: sophie.id, centi: 1500, kind: 'cupboard', note: 'Found 15 Crumbs in a capsule', createdAt: ago(5, 18) }).run();
		await tx.insert(clawPlays).values({ memberId: sophie.id, day: addDays(day, -5), free: true, capsule: '{"type":"round","colour":"pink"}', prizeKey: 'crumbs15', createdAt: ago(5, 18) }).run();
		await tx.insert(clawPlays).values({ memberId: sophie.id, day: addDays(day, -1), free: true, capsule: '{"type":"special","shape":"croissant"}', prizeKey: 'croissant', createdAt: ago(1, 17) }).run();
		await tx.insert(vouchers).values({ memberId: sophie.id, code: voucherCode(), rewardKey: 'croissant', source: 'cupboard', expiresAt: ago(-29), createdAt: ago(1, 17) }).run();
	});
}
