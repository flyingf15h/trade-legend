<script lang="ts" module>
	export type Capsule = { type: 'round'; colour: string } | { type: 'special'; shape: string };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { ART } from '#lib/art.ts';
	import { CAPSULE_COLOURS, SPECIAL_SHAPES } from '#lib/rewards.ts';

	// Umamusume-style crane. The machine is much wider than the screen: hold the one button and
	// the claw slides right while the view scrolls along with it; let go and it drops. It then
	// carries the capsule back to the prize chute at the start. The claw gets a little quicker
	// with every turn in a day. Where it lands is just for fun: it always comes back with the
	// capsule the server already picked.

	// Field units: the play field is FIELD_W wide and 300 tall, scaled to the window's height.
	const FIELD_W = 1100;
	const REST_Y = 24;
	const START_X = 62; // above the chute
	const X_MAX = 1060;
	const SIZE = 36;
	const GRAB = 52; // capsule centre sits this far below the top of the claw head
	const POSTS = [240, 500, 760, 1020];

	let {
		canPlay,
		label,
		turn = 0,
		start,
		ondone
	}: {
		canPlay: boolean;
		label: string;
		// how many turns were already taken today; each one speeds the claw up
		turn?: number;
		// asks the server for the result; resolves to anything but a string to go ahead, or an
		// error message
		start: () => Promise<Capsule | string>;
		ondone: (capsule: Capsule) => void;
	} = $props();

	type Phase = 'idle' | 'starting' | 'aim' | 'busy';
	let open = $state(false);
	let phase = $state<Phase>('idle');
	let problem = $state<string | null>(null);
	let x = $state(START_X);
	let y = $state(REST_Y);
	let arm = $state(10); // degrees each arm is opened
	let held = $state<Capsule | null>(null);
	let falling = $state<{ cap: Capsule; y: number } | null>(null);
	let speed = 160;

	// ---- a deep heap of capsules along the whole floor ----
	// The treat-shaped capsules sit in the bottom two layers, under a full layer of round ones, so
	// the claw can never reach them. They're just there to peek through and tempt.
	let seed = 21;
	const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
	type Piled = { id: number; x: number; y: number; rot: number; cap: Capsule };
	const layers = [
		{ y: 266, gap: 0, specials: true },
		{ y: 245, gap: 0, specials: true },
		{ y: 224, gap: 0, specials: false },
		{ y: 203, gap: 0.12, specials: false },
		{ y: 182, gap: 0.45, specials: false }
	];
	const heap: Piled[] = [];
	let n = 0;
	const round = (): Capsule => ({ type: 'round', colour: CAPSULE_COLOURS[Math.floor(rand() * CAPSULE_COLOURS.length)] });
	for (const [li, l] of layers.entries()) {
		for (let px = 128 + (li % 2) * 15 + rand() * 4; px < 1088; px += SIZE - 6 + rand() * 4) {
			if (rand() < l.gap) continue;
			const special = l.specials && rand() < 0.13;
			heap.push({
				id: n++,
				x: px,
				y: l.y + (rand() - 0.5) * 5,
				rot: (rand() - 0.5) * 40,
				cap: special ? { type: 'special', shape: SPECIAL_SHAPES[Math.floor(rand() * SPECIAL_SHAPES.length)] } : round()
			});
		}
	}
	let pile = $state(heap);

	// ---- the window and its camera ----
	let viewW = $state(360);
	let viewH = $state(300);
	let u = $derived(viewH / 300); // px per field unit
	let camMax = $derived(Math.max(0, FIELD_W - viewW / u));
	let cam = $derived(Math.min(camMax, Math.max(0, x - (viewW / u) * 0.42)));

	// ---- animation helpers ----
	let raf = 0;
	let alive = true;
	onDestroy(() => {
		alive = false;
		if (raf) cancelAnimationFrame(raf);
		if (typeof document !== 'undefined') document.body.style.overflow = '';
	});

	const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
	function animate(ms: number, step: (t: number) => void) {
		return new Promise<void>((resolve) => {
			const t0 = performance.now();
			const tick = (now: number) => {
				if (!alive) return resolve();
				const t = Math.min(1, (now - t0) / ms);
				step(ease(t));
				if (t < 1) raf = requestAnimationFrame(tick);
				else resolve();
			};
			raf = requestAnimationFrame(tick);
		});
	}
	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

	// ---- the one button ----
	let holding = false;
	let last = 0;
	function holdLoop(now: number) {
		if (!holding || !alive) return;
		const dt = Math.min(50, now - last) / 1000;
		last = now;
		x = Math.min(X_MAX, x + speed * dt);
		if (x >= X_MAX) return release();
		raf = requestAnimationFrame(holdLoop);
	}

	function press() {
		if (holding || phase !== 'aim') return;
		holding = true;
		last = performance.now();
		raf = requestAnimationFrame(holdLoop);
	}

	function release() {
		if (!holding) return;
		holding = false;
		cancelAnimationFrame(raf);
		drop();
	}

	function setOpen(v: boolean) {
		open = v;
		document.body.style.overflow = v ? 'hidden' : '';
	}

	// opens the machine fullscreen and starts a turn
	export async function begin() {
		if (phase !== 'idle') return;
		setOpen(true);
		if (!canPlay) {
			problem = 'You need a few more Crumbs for another turn. Come back tomorrow for a free one!';
			return;
		}
		problem = null;
		phase = 'starting';
		// read before start(), which refreshes the page data and bumps the turn count
		speed = 160 * (1 + 0.3 * Math.min(turn, 4));
		const r = await start();
		if (typeof r === 'string') {
			problem = r;
			phase = 'idle';
			return;
		}
		phase = 'aim';
	}

	function close() {
		if (phase !== 'idle') return;
		problem = null;
		setOpen(false);
	}

	// the capsule under the claw: the highest one close by, or failing that the nearest
	function target() {
		const reachable = pile.filter((p) => p.cap.type === 'round');
		const near = reachable.filter((p) => Math.abs(p.x - x) < 22);
		if (near.length) return near.reduce((a, b) => (b.y < a.y ? b : a));
		return reachable.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
	}

	async function drop() {
		phase = 'busy';
		const best = target();
		const fromX = x;
		await animate(260, (t) => {
			arm = 10 + 22 * t;
			x = fromX + (best.x - fromX) * t;
		});
		const targetY = best.y - GRAB;
		await animate(850, (t) => (y = REST_Y + (targetY - REST_Y) * t));
		await wait(140);
		await animate(300, (t) => (arm = 32 - 28 * t));
		pile = pile.filter((p) => p.id !== best.id);
		held = best.cap;
		await wait(180);
		await animate(850, (t) => (y = targetY + (REST_Y - targetY) * t));
		await wait(160);
		// back along the machine to the chute, the view scrolling with it
		const cx = x;
		const back = Math.min(2600, 500 + (cx - START_X) * 2.2);
		await animate(back, (t) => (x = cx + (START_X - cx) * t));
		await wait(220);
		const cap = held;
		const from = REST_Y + GRAB;
		falling = { cap, y: from };
		held = null;
		animate(200, (t) => (arm = 4 + 24 * t));
		await animate(480, (t) => (falling = { cap, y: from + (300 - from) * t * t }));
		falling = null;
		await animate(260, (t) => (arm = 28 - 18 * t));
		// tip a fresh capsule back onto the top of the heap for next time
		pile = [...pile, { ...best, id: n++, cap: round() }];
		phase = 'idle';
		ondone(cap);
	}

	function key(e: KeyboardEvent, down: boolean) {
		if (e.key !== ' ' && e.key !== 'Enter') return;
		e.preventDefault();
		if (down && !e.repeat) press();
		if (!down) release();
	}

	const f = (v: number) => `calc(${v} * var(--u))`;
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && close()} />

{#snippet capsule(cap: Capsule, size: number)}
	{#if cap.type === 'special'}
		<img src={ART.capsuleSpecial[cap.shape]} alt="" style="width:{f(size * 1.15)}" />
	{:else}
		<img src={ART.capsule[cap.colour] ?? ART.capsule.pink} alt="" style="width:{f(size)}" />
	{/if}
{/snippet}

{#snippet sparkles()}
	<img src={ART.sparkle} alt="" class="twinkle a" />
	<img src={ART.sparkle} alt="" class="twinkle b" />
{/snippet}

<div class="machine" class:open>
	{#if open}
		<div class="topbar">
			<button class="close" onclick={close} disabled={phase !== 'idle'} aria-label="Close the claw machine">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
			</button>
		</div>
	{/if}

	<div class="frame">
		{#if open}
			<div class="marquee">
				<span class="bulbs" aria-hidden="true"></span>
				<span class="name">Grandma&rsquo;s Lucky Cupboard</span>
			</div>
		{/if}
		<div
			class="window"
			bind:clientWidth={viewW}
			bind:clientHeight={viewH}
			style="--u:{u}px"
			role="group"
			aria-label="Claw machine"
		>
			<div class="field" style="width:{f(FIELD_W)}; transform: translateX(calc({-cam} * var(--u)))">
				<div class="ceiling"></div>
				<div class="rail"></div>
				{#each POSTS as px (px)}
					<div class="post" style="left:{f(px)}"></div>
				{/each}
				<p class="sign" style="left:{f(18)}; top:{f(118)}; font-size:{f(17)}">prizes &darr;</p>
				<div class="floor"></div>
				<div class="chute" style="left:{f(22)}; width:{f(80)}"></div>

				{#each pile as p (p.id)}
					<div
						class="piled"
						style="left:{f(p.x)}; top:{f(p.y)}; z-index:{Math.round(300 - p.y)}; transform: translate(-50%,-50%) rotate({p.rot}deg)"
					>
						{@render capsule(p.cap, SIZE)}
						{#if p.cap.type === 'special'}{@render sparkles()}{/if}
					</div>
				{/each}

				<div class="cable" style="left:{f(x)}; top:{f(18)}; height:{f(y - 18 + 4)}"></div>
				<div class="claw" style="left:{f(x)}; top:{f(y)}">
					<img src={ART.clawArm} alt="" class="arm left" style="width:{f(15)}; left:{f(-19)}; top:{f(20)}; transform: rotate({arm}deg)" />
					<img src={ART.clawArm} alt="" class="arm right" style="width:{f(15)}; left:{f(4)}; top:{f(20)}; transform: scaleX(-1) rotate({arm}deg)" />
					{#if held}
						<div class="held" class:shiny={held.type === 'special'} style="top:{f(GRAB)}">
							{@render capsule(held, SIZE)}
						</div>
					{/if}
					<img src={ART.clawHead} alt="" class="head" style="width:{f(40)}" />
				</div>

				{#if falling}
					<div class="piled" style="left:{f(START_X)}; top:{f(falling.y)}; z-index:5; transform: translate(-50%,-50%)">
						{@render capsule(falling.cap, SIZE)}
					</div>
				{/if}
				<div class="floor-front" style="width:{f(FIELD_W)}"></div>
			</div>
			<div class="glass"></div>
		</div>

		<div class="panel">
			{#if phase === 'aim' || phase === 'busy'}
				<button
					class="hold"
					class:live={phase === 'aim'}
					disabled={phase !== 'aim'}
					onpointerdown={(e) => {
						(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
						press();
					}}
					onpointerup={release}
					onpointercancel={release}
					onkeydown={(e) => key(e, true)}
					onkeyup={(e) => key(e, false)}
					oncontextmenu={(e) => e.preventDefault()}
				>
					<b>HOLD</b>
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
					<span class="sr-only">Hold to move the claw, let go to drop it</span>
				</button>
				<p class="hint">
					{#if phase === 'aim'}Hold to slide the claw along. Let go to drop!{#if turn > 0}<br /><small>The claw&rsquo;s a little quicker now&hellip;</small>{/if}
					{:else}Here it comes&hellip;{/if}
				</p>
			{:else}
				<button class="btn play" onclick={begin} disabled={phase === 'starting'}>
					{phase === 'starting' ? 'Opening the cupboard…' : label}
				</button>
				{#if problem}<p class="problem" role="alert">{problem}</p>{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	/* ---------- inline preview vs fullscreen ---------- */
	.machine {
		--brown: #5a3a2e;
		--wall: #ffd6dc;
		--yellow: #f8c94f;
		--orange: #f2a64a;
	}
	.machine:not(.open) .window {
		height: 250px;
	}
	.machine:not(.open) .panel {
		background: none;
		border: 0;
		padding: 18px 0 0;
		box-shadow: none;
		min-height: 0;
	}
	.machine.open {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		background: #f7b9c2;
		padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
		animation: zoom 0.25s ease-out;
	}
	@keyframes zoom {
		from {
			transform: scale(0.94);
			opacity: 0;
		}
	}
	.machine.open .frame {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		padding: 0 12px 12px;
	}
	.machine.open .frame {
		justify-content: center;
	}
	.machine.open .window {
		flex: 1;
		min-height: 0;
		/* keep it a wide, long window rather than a tall empty one */
		max-height: min(118vw, 560px);
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}
	.marquee {
		position: relative;
		background: #f59aa8;
		border: 4px solid var(--brown);
		border-bottom: 0;
		border-radius: 22px 22px 0 0;
		padding: 18px 12px 14px;
		text-align: center;
	}
	.bulbs {
		position: absolute;
		left: 14px;
		right: 14px;
		top: 6px;
		height: 8px;
		background: radial-gradient(circle, #fff6c2 3px, transparent 3.5px) 0 0 / 18px 8px repeat-x;
		animation: blink 1s steps(2) infinite;
	}
	@keyframes blink {
		50% {
			background-position: 9px 0;
		}
	}
	.topbar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
	}
	.close {
		width: 44px;
		height: 44px;
		border: 0;
		background: none;
		color: var(--brown);
		cursor: pointer;
		flex: none;
	}
	.close:disabled {
		opacity: 0.25;
	}
	.close svg {
		width: 28px;
		height: 28px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.6;
		stroke-linecap: round;
	}
	.name {
		font: 400 1.7rem var(--display);
		color: #fff;
		-webkit-text-stroke: 1.5px var(--brown);
		paint-order: stroke fill;
		text-shadow: 0 3px 0 var(--brown);
	}

	/* ---------- the window and play field ---------- */
	.window {
		position: relative;
		overflow: hidden;
		border: 4px solid var(--brown);
		border-radius: 22px;
		background: var(--wall);
		box-shadow:
			inset 0 0 0 6px var(--yellow),
			inset 0 0 0 9px var(--brown);
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
	}
	.window img {
		max-width: none;
	}
	.field {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		will-change: transform;
		/* pink wall with a soft star print, darker toward the floor like the reference */
		background:
			radial-gradient(circle at 25% 30%, rgba(255, 255, 255, 0.7) 1.2px, transparent 2px) 0 0 / 26px 26px,
			radial-gradient(circle at 70% 75%, rgba(255, 255, 255, 0.5) 1px, transparent 1.8px) 0 0 / 34px 34px,
			linear-gradient(#ffe3e7, #f9b6c2);
	}
	.ceiling {
		position: absolute;
		inset: 0 0 auto 0;
		height: calc(14 * var(--u));
		background: #f59aa8;
		border-bottom: 3px solid var(--brown);
	}
	.rail {
		position: absolute;
		left: 0;
		right: 0;
		top: calc(14 * var(--u));
		height: calc(6 * var(--u));
		background: #e9d9cf;
		border-bottom: 2px solid var(--brown);
	}
	.post {
		position: absolute;
		top: calc(20 * var(--u));
		bottom: calc(30 * var(--u));
		width: calc(16 * var(--u));
		margin-left: calc(-8 * var(--u));
		background: linear-gradient(90deg, var(--yellow) 0 55%, var(--orange) 55%);
		border: 3px solid var(--brown);
		border-top: 0;
	}
	.sign {
		position: absolute;
		margin: 0;
		font-family: var(--hand);
		font-weight: 700;
		color: var(--brown);
		white-space: nowrap;
	}
	.floor {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: calc(32 * var(--u));
		background: #fbc6ce;
		border-top: 3px solid var(--brown);
	}
	.chute {
		position: absolute;
		bottom: 0;
		height: calc(34 * var(--u));
		background: #7a4b3c;
		border: 3px solid var(--brown);
		border-bottom: 0;
		border-radius: 10px 10px 0 0;
		box-shadow: inset 0 0 0 4px var(--yellow);
		z-index: 4;
	}
	.floor-front {
		position: absolute;
		left: 0;
		bottom: 0;
		height: calc(8 * var(--u));
		background: #f59aa8;
		border-top: 3px solid var(--brown);
		z-index: 6;
	}
	.piled {
		position: absolute;
		line-height: 0;
		pointer-events: none;
	}
	.piled img,
	.held img {
		display: block;
	}
	.cable {
		position: absolute;
		width: 4px;
		margin-left: -2px;
		background: #9c8579;
		box-shadow: inset 1px 0 0 #c9b4aa;
		z-index: 400;
	}
	.claw {
		position: absolute;
		width: 0;
		height: 0;
		z-index: 401;
	}
	.claw .head {
		position: absolute;
		left: 0;
		top: 0;
		transform: translateX(-50%);
	}
	.claw .arm {
		position: absolute;
		transform-origin: 70% 6%;
	}
	.claw .arm.right {
		transform-origin: 30% 6%;
	}
	.held {
		position: absolute;
		left: 0;
		transform: translate(-50%, -50%);
		line-height: 0;
	}
	.shiny {
		filter: drop-shadow(0 0 6px #fff6c2) drop-shadow(0 0 12px #f2c94c);
	}
	.glass {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 10;
		background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.28) 32%, rgba(255, 255, 255, 0.1) 38%, transparent 40%);
	}
	/* treat-shaped capsules glint gold, like the special plushies */
	.twinkle {
		position: absolute;
		width: 12px;
		pointer-events: none;
		animation: twinkle 1.6s ease-in-out infinite;
	}
	.twinkle.a {
		top: -4px;
		right: -6px;
	}
	.twinkle.b {
		bottom: 2px;
		left: -6px;
		width: 9px;
		animation-delay: 0.8s;
	}
	@keyframes twinkle {
		0%,
		100% {
			transform: scale(0.2) rotate(0);
			opacity: 0;
		}
		50% {
			transform: scale(1) rotate(45deg);
			opacity: 1;
		}
	}

	/* ---------- control panel ---------- */
	.panel {
		margin-top: 12px;
		padding: 16px 16px 14px;
		background: var(--yellow);
		border: 4px solid var(--brown);
		border-radius: 22px;
		box-shadow: inset 0 -8px 0 var(--orange);
		text-align: center;
		min-height: 150px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.play {
		width: 100%;
		max-width: 380px;
		font-size: 1.6rem;
		padding: 18px;
	}
	.problem {
		margin: 10px 0 0;
		font-weight: 700;
		color: var(--maroon-dk);
	}
	.hold {
		width: 104px;
		height: 104px;
		border-radius: 50%;
		border: 4px solid var(--brown);
		background: #f6c3cf;
		color: var(--brown);
		box-shadow: 0 7px 0 var(--brown);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		transition: transform 0.06s, box-shadow 0.06s;
	}
	.hold b {
		font: 400 1.4rem var(--display);
		line-height: 1;
	}
	.hold svg {
		width: 30px;
		height: 30px;
		fill: none;
		stroke: currentColor;
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.hold.live {
		background: #ff9fb0;
		animation: pulse 1.2s ease-in-out infinite;
	}
	.hold.live:active {
		transform: translateY(6px);
		box-shadow: 0 1px 0 var(--brown);
		animation: none;
	}
	.hold:disabled {
		cursor: default;
		opacity: 0.75;
	}
	@keyframes pulse {
		50% {
			box-shadow:
				0 7px 0 var(--brown),
				0 0 0 9px rgba(255, 255, 255, 0.45);
		}
	}
	.hint {
		margin: 12px 0 0;
		font-weight: 700;
		color: var(--brown);
		min-height: 2.6em;
	}
</style>
