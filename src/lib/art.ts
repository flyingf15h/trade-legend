// Every drawing in the app comes through here. To drop in the hand-drawn versions, put the
// files in static/art/ and point the matching entry at them (PNG, WebP or SVG all work).
// The claw machine's play field (walls, posts, floor, chute) is drawn in CSS in
// ClawMachine.svelte; the claw and capsules are these images. Capsules come in halves for the
// opening animation: one clear top shared by all, and a coloured bottom per colour.

const a = (f: string) => `/art/${f}`;

const px = (f: string) => `/art/px/${f}.svg`;

export const ART = {
	clawHead: a('claw-head.svg'),
	clawArm: a('claw-arm.svg'),
	capsuleTop: a('capsule-top.svg'),
	capsuleBottom: Object.fromEntries(
		['pink', 'mint', 'butter', 'sky', 'lilac', 'peach'].map((c) => [c, a(`capsule-bottom-${c}.svg`)])
	) as Record<string, string>,
	capsule: Object.fromEntries(
		['pink', 'mint', 'butter', 'sky', 'lilac', 'peach'].map((c) => [c, a(`capsule-${c}.svg`)])
	) as Record<string, string>,
	capsuleSpecial: {
		coffee: px('capsule-special-coffee'),
		croissant: px('capsule-special-croissant'),
		muffin: px('capsule-special-muffin'),
		parfait: px('capsule-special-parfait')
	} as Record<string, string>,
	crumbBox: px('crumb-box'),
	sparkle: px('sparkle'),
	twinkle: px('twinkle'),
	cookieFace: px('cookie-face'),
	spoon: px('spoon'),
	jar: (n: number) => px(`jar-${Math.min(8, Math.max(1, n))}`),
	avatar: {
		croissant: px('avatar-croissant'),
		tart: px('avatar-tart'),
		loaf: px('avatar-loaf'),
		cookie: px('avatar-cookie')
	} as Record<string, string>,
	// little pixel icons for tabs, lists and buttons
	icon: {
		house: px('house'),
		gift: px('gift'),
		star: px('star'),
		heart: px('heart'),
		ticket: px('ticket'),
		receipt: px('receipt'),
		qr: px('qr'),
		dice: px('dice'),
		pie: px('pie'),
		croissant: px('croissant'),
		cake: px('cake'),
		cookie: px('cookie'),
		spoon: px('spoon'),
		sparkle: px('sparkle')
	} as Record<string, string>,
	// treats, flavours and reward pictures. The PNGs are the pictures you picked; the rest are
	// pixel sprites drawn by scripts/pixel_sprites.py
	food: {
		bogo: px('bogo'),
		cake: px('cake'),
		coffee: a('coffee.png'),
		cookie: px('cookie'),
		croissant: px('croissant'),
		crumble: px('crumble'),
		muffin: px('muffin'),
		parfait: a('parfait.png'),
		pie: px('pie'),
		pudding: a('pudding.png'),
		puff: a('cream-cake.png'),
		roll: px('roll'),
		sample: px('sample'),
		scone: px('scone'),
		tag: px('tag'),
		tart: px('tart')
	} as Record<string, string>
};
