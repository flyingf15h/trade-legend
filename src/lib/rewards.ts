// Everything Grandma might want to tune lives here: earning rates, the Treat Shelf, and the
// Lucky Cupboard odds. Check the shelf costs against real product costs before launch.

export const EARN = {
	crumbsPerDollar: 5,
	vote: 100,
	review: 250,
	referrer: 150,
	referee: 50,
	referralMinCents: 500,
	referralMonthlyLimit: 5
};

export const PLAY_COST = 10;
export const SHELF_DAYS = 60;
export const CUPBOARD_DAYS = 30;

export type Reward = {
	title: string;
	short: string;
	terms: string;
	art: string;
	maxDiscount?: string;
};

export const REWARDS: Record<string, Reward> = {
	drink: {
		title: 'Free drink',
		short: 'any regular drink',
		terms: 'Any regular-size coffee, tea or latte. Size upgrades, extra shots and syrups are extra.',
		art: 'coffee'
	},
	pct10: {
		title: '10% off',
		short: 'one purchase',
		terms: '10% off one purchase, up to $5 off. Not valid on gift cards or whole-cake orders.',
		art: 'tag',
		maxDiscount: '$5'
	},
	pct12: {
		title: '12% off',
		short: 'one purchase',
		terms: '12% off one purchase, up to $6 off. Not valid on gift cards or whole-cake orders.',
		art: 'tag',
		maxDiscount: '$6'
	},
	pct15: {
		title: '15% off',
		short: 'one purchase',
		terms: '15% off one purchase, up to $8 off. Not valid on gift cards or whole-cake orders.',
		art: 'tag',
		maxDiscount: '$8'
	},
	cookie: {
		title: 'Free cookie',
		short: 'with any purchase',
		terms: 'One standard cookie from the case with any purchase. Specialty and decorated cookies excluded.',
		art: 'cookie'
	},
	bogo: {
		title: 'Buy one, get one',
		short: 'selected items',
		terms: 'Buy one pastry or drink, get a second free. The lower-priced item is free. Parfaits and cakes excluded.',
		art: 'bogo'
	},
	pastry: {
		title: 'Free pastry',
		short: 'any pastry in the case',
		terms: 'Any single pastry from the case: croissants, muffins, scones, cream puffs.',
		art: 'croissant'
	},
	sample: {
		title: 'Free sample',
		short: 'a little taste',
		terms: 'A tasting-size piece of whatever Grandma is sampling today.',
		art: 'sample'
	},
	coffee: {
		title: 'Free coffee',
		short: 'a cup on Grandma',
		terms: 'One regular drip coffee or tea. Upgrades are extra.',
		art: 'coffee'
	},
	croissant: {
		title: 'Free croissant',
		short: 'fresh from the oven',
		terms: 'One butter croissant. Swap for an almond or chocolate croissant for $1.',
		art: 'croissant'
	},
	muffin: {
		title: 'Free muffin',
		short: 'any muffin',
		terms: 'Any muffin from the case.',
		art: 'muffin'
	},
	parfait: {
		title: 'Free fall parfait',
		short: 'the seasonal parfait',
		terms: 'One of this season’s parfaits, while they last.',
		art: 'parfait'
	},
	birthday: {
		title: 'Birthday pastry',
		short: 'happy birthday!',
		terms: 'Any single pastry from the case, any day during your birthday week.',
		art: 'cake'
	}
};

export const SHELF: { key: string; cost: number }[] = [
	{ key: 'drink', cost: 100 },
	{ key: 'pct10', cost: 100 },
	{ key: 'pct15', cost: 120 },
	{ key: 'cookie', cost: 150 },
	{ key: 'bogo', cost: 200 },
	{ key: 'pastry', cost: 250 }
];

export type Prize =
	| { kind: 'crumbs'; amount: number }
	| { kind: 'voucher'; reward: string }
	| { kind: 'double' };

// 9 in 10 plays give a round capsule, 1 in 10 a capsule shaped like a bakery item.
export const SPECIAL_ODDS = 0.1;

// Round capsules. Weights are relative. The expected Crumbs back per play is about 7, so
// paying 10 Crumbs to replay stays a small treat rather than a way to farm points.
export const ROUND_PRIZES: { weight: number; prize: Prize; label: string }[] = [
	{ weight: 34, prize: { kind: 'crumbs', amount: 10 }, label: '10 Crumbs' },
	{ weight: 15, prize: { kind: 'crumbs', amount: 15 }, label: '15 Crumbs' },
	{ weight: 8, prize: { kind: 'crumbs', amount: 20 }, label: '20 Crumbs' },
	{ weight: 2, prize: { kind: 'crumbs', amount: 50 }, label: '50 Crumbs' },
	{ weight: 15, prize: { kind: 'voucher', reward: 'sample' }, label: 'Free sample' },
	{ weight: 8, prize: { kind: 'double' }, label: 'Double Crumbs next visit' },
	{ weight: 10, prize: { kind: 'voucher', reward: 'pct10' }, label: '10% off' },
	{ weight: 5, prize: { kind: 'voucher', reward: 'pct12' }, label: '12% off' },
	{ weight: 3, prize: { kind: 'voucher', reward: 'pct15' }, label: '15% off' }
];

// Shaped capsules always hold the item they look like.
export const SPECIAL_SHAPES = ['coffee', 'croissant', 'muffin', 'parfait'] as const;

export const CAPSULE_COLOURS = ['pink', 'mint', 'butter', 'sky'] as const;

export const ICONS: { key: string; label: string }[] = [
	{ key: 'croissant', label: 'Smiling croissant' },
	{ key: 'tart', label: 'Strawberry tart' },
	{ key: 'loaf', label: 'Sleepy bread loaf' },
	{ key: 'cookie', label: 'Chocolate-chip cookie' }
];

export function crumbs(centi: number) {
	return Math.floor(centi / 100);
}
