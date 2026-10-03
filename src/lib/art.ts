// Every drawing in the app comes through here. To drop in the hand-drawn versions, put the
// files in static/art/ and point the matching entry at them (PNG, WebP or SVG all work).
// The claw machine's play field (walls, posts, floor, chute) is drawn in CSS in
// ClawMachine.svelte; the claw and capsules are these images. Capsules come in halves for the
// opening animation: one clear top shared by all, and a coloured bottom per colour.

const a = (f: string) => `/art/${f}`;

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
		coffee: a('capsule-special-coffee.svg'),
		croissant: a('capsule-special-croissant.svg'),
		muffin: a('capsule-special-muffin.svg'),
		parfait: a('capsule-special-parfait.svg')
	} as Record<string, string>,
	crumbBox: a('crumb-box.svg'),
	sparkle: a('sparkle.svg'),
	twinkle: a('twinkle.svg'),
	cookieFace: a('cookie-face.svg'),
	spoon: a('spoon.svg'),
	avatar: {
		croissant: a('avatar-croissant.svg'),
		tart: a('avatar-tart.svg'),
		loaf: a('avatar-loaf.svg'),
		cookie: a('avatar-cookie.svg')
	} as Record<string, string>,
	// treats, flavours and reward pictures
	food: {
		bogo: a('bogo.svg'),
		cake: a('cake.svg'),
		coffee: a('coffee.png'),
		cookie: a('cookie.svg'),
		croissant: a('croissant.svg'),
		crumble: a('crumble.svg'),
		muffin: a('muffin.svg'),
		parfait: a('parfait.png'),
		pudding: a('pudding.png'),
		puff: a('cream-cake.png'),
		roll: a('roll.svg'),
		sample: a('sample.svg'),
		scone: a('scone.svg'),
		tag: a('tag.svg'),
		tart: a('tart.svg')
	} as Record<string, string>
};
