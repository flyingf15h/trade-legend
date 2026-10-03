// Every drawing in the app comes through here. To drop in the hand-drawn versions, put the
// files in static/art/ and point the matching entry at them (PNG, WebP or SVG all work).
// The cupboard frame must keep its window at x 28-332, y 96-372 and its prize chute at
// x 40-140, y 410-486 on a 360 x 548 canvas, since the claw and capsules sit behind those holes.

const a = (f: string) => `/art/${f}`;

export const ART = {
	cupboard: a('cupboard.svg'),
	doily: a('doily.svg'),
	clawHead: a('claw-head.svg'),
	clawArm: a('claw-arm.svg'),
	capsuleBottom: a('capsule-bottom.svg'),
	capsuleTop: {
		pink: a('capsule-top-pink.svg'),
		mint: a('capsule-top-mint.svg'),
		butter: a('capsule-top-butter.svg'),
		sky: a('capsule-top-sky.svg')
	} as Record<string, string>,
	capsuleSpecial: {
		coffee: a('capsule-special-coffee.svg'),
		croissant: a('capsule-special-croissant.svg'),
		muffin: a('capsule-special-muffin.svg'),
		parfait: a('capsule-special-parfait.svg')
	} as Record<string, string>,
	crumbBox: a('crumb-box.svg'),
	sparkle: a('sparkle.svg'),
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
		coffee: a('coffee.svg'),
		cookie: a('cookie.svg'),
		croissant: a('croissant.svg'),
		crumble: a('crumble.svg'),
		muffin: a('muffin.svg'),
		parfait: a('parfait.svg'),
		pudding: a('pudding.svg'),
		puff: a('puff.svg'),
		roll: a('roll.svg'),
		sample: a('sample.svg'),
		scone: a('scone.svg'),
		tag: a('tag.svg'),
		tart: a('tart.svg')
	} as Record<string, string>
};
