<script lang="ts" module>
	export type Capsule = { type: 'round'; colour: string } | { type: 'special'; shape: string };
</script>


<script lang="ts">
	import { onDestroy } from 'svelte';
	import { ART } from '#lib/art.ts';
	import { CAPSULE_COLOURS, SPECIAL_SHAPES } from '#lib/rewards.ts';

	// Umamusume-style crane: a side view and a single button. Hold it to slide the claw across,
	// let go to drop. The claw gets a little quicker with every turn you take in a day.
	// Where you let go is just for fun: the claw always comes back with the capsule the server picked.

	// All positions are in the cupboard drawing's own units (360 wide, 548 tall), so the whole
	// machine scales with its container. Window: x 28-332, y 96-372. Chute: x 40-140, y 410-486.
	const REST_Y = 102;
	const X_MIN = 70;
	const X_MAX = 306;
	const CHUTE_X = 90;
	const SIZE = 44;

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
		// asks the server for the result; returns the capsule the claw should come back with
		start: () => Promise<Capsule | null>;
		ondone: (capsule: Capsule) => void;
	} = $props();

	type Phase = 'idle' | 'starting' | 'aim' | 'busy' | 'tray';
	let phase = $state<Phase>('idle');
	let x = $state(X_MIN);
	let y = $state(REST_Y);
	let arm = $state(12); // degrees each arm is opened
	let held = $state<Capsule | null>(null);
	let falling = $state<{ cap: Capsule; y: number } | null>(null);
	let tray = $state<Capsule | null>(null);
	let speed = 90;

	// ---- the heap of capsules, seen from the side ----
	let seed = 11;
	const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
	type Piled = { id: number; x: number; y: number; rot: number; cap: Capsule };
	// each layer sits a little higher and narrower, like a mound
	const layers = [
		{ y: 348, from: 52, to: 312 },
		{ y: 316, from: 72, to: 292 },
		{ y: 286, from: 100, to: 262 },
		{ y: 258, from: 140, to: 220 }
	];
	const heap: Piled[] = [];
	let n = 0;
	for (const [li, l] of layers.entries()) {
		for (let px = l.from + (li % 2) * 18 + rand() * 6; px <= l.to; px += SIZE - 4 + rand() * 8) {
			heap.push({
				id: n,
				x: px,
				y: l.y + (rand() - 0.5) * 8,
				rot: (rand() - 0.5) * 60,
				cap:
					n % 9 === 5
						? { type: 'special', shape: SPECIAL_SHAPES[n % SPECIAL_SHAPES.length] }
						: { type: 'round', colour: CAPSULE_COLOURS[Math.floor(rand() * CAPSULE_COLOURS.length)] }
			});
			n++;
		}
	}
	let pile = $state(heap);

	// ---- animation helpers ----
	let raf = 0;
	let alive = true;
	onDestroy(() => {
		alive = false;
		if (raf) cancelAnimationFrame(raf);
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

	let result: Capsule | null = null;

	export async function begin() {
		if (phase !== 'idle' || !canPlay) return;
		phase = 'starting';
		tray = null;
		// read before start(), which refreshes the page data and bumps the turn count
		speed = 90 * (1 + 0.3 * Math.min(turn, 4));
		result = await start();
		if (!result) {
			phase = 'idle';
			return;
		}
		phase = 'aim';
	}

	// the capsule under the claw: the highest one close by, or failing that the nearest
	function target() {
		const near = pile.filter((p) => Math.abs(p.x - x) < 26);
		const pool = near.length ? near : pile;
		return pool.reduce((a, b) => {
			const sa = near.length ? a.y : Math.abs(a.x - x);
			const sb = near.length ? b.y : Math.abs(b.x - x);
			return sb < sa ? b : a;
		});
	}

	async function drop() {
		phase = 'busy';
		const best = target();
		const fromX = x;
		await animate(240, (t) => {
			arm = 12 + 22 * t;
			x = fromX + (best.x - fromX) * t;
		});
		const targetY = best.y - 66;
		await animate(900, (t) => (y = REST_Y + (targetY - REST_Y) * t));
		await wait(150);
		await animate(320, (t) => (arm = 34 - 30 * t));
		pile = pile.filter((p) => p.id !== best.id);
		held = result!;
		await wait(200);
		await animate(950, (t) => (y = targetY + (REST_Y - targetY) * t));
		await wait(200);
		const cx = x;
		await animate(1000, (t) => (x = cx + (CHUTE_X - cx) * t));
		await wait(250);
		// let go over the chute
		const dropFrom = REST_Y + 66;
		const cap = held;
		falling = { cap, y: dropFrom };
		held = null;
		animate(200, (t) => (arm = 4 + 26 * t));
		await animate(520, (t) => (falling = { cap, y: dropFrom + (440 - dropFrom) * t * t }));
		tray = cap;
		falling = null;
		phase = 'tray';
		await animate(300, (t) => (arm = 30 - 18 * t));
		// tip a fresh capsule back onto the heap for next time
		pile = [...pile, { ...best, id: n++ }];
	}

	function openTray() {
		if (phase !== 'tray' || !tray) return;
		const cap = tray;
		tray = null;
		phase = 'idle';
		x = X_MIN;
		y = REST_Y;
		ondone(cap);
	}

	function key(e: KeyboardEvent, down: boolean) {
		if (e.key !== ' ' && e.key !== 'Enter') return;
		e.preventDefault();
		if (down && !e.repeat) press();
		if (!down) release();
	}

	const u = (v: number) => `calc(${v} * 100cqw / 360)`;
</script>

{#snippet capsule(cap: Capsule, size: number)}
	{#if cap.type === 'special'}
		<img src={ART.capsuleSpecial[cap.shape]} alt="" style="width:{u(size * 1.12)}" />
	{:else}
		<span class="round" style="width:{u(size)}">
			<img src={ART.capsuleTop[cap.colour]} alt="" />
			<img src={ART.capsuleBottom} alt="" />
		</span>
	{/if}
{/snippet}

{#snippet sparkles()}
	<img src={ART.sparkle} alt="" class="twinkle a" />
	<img src={ART.sparkle} alt="" class="twinkle b" />
{/snippet}

<div class="machine-wrap">
	<img src={ART.doily} alt="" class="doily" />
	<div class="machine" aria-label="Grandma's Lucky Cupboard claw machine" role="group">
		<div class="window"></div>

		{#each pile as p (p.id)}
			<div
				class="piled"
				style="left:{u(p.x)}; top:{u(p.y)}; z-index:{Math.round(400 - p.y) + 2}; transform: translate(-50%,-50%) rotate({p.rot}deg)"
			>
				{@render capsule(p.cap, SIZE)}
				{#if p.cap.type === 'special'}{@render sparkles()}{/if}
			</div>
		{/each}

		<!-- the claw -->
		<div class="cable" style="left:{u(x)}; top:{u(96)}; height:{u(y - 96 + 6)}"></div>
		<div class="claw" style="left:{u(x)}; top:{u(y)}">
			<img src={ART.clawArm} alt="" class="arm left" style="width:{u(20)}; left:{u(-24)}; top:{u(30)}; transform: rotate({arm}deg)" />
			<img src={ART.clawArm} alt="" class="arm right" style="width:{u(20)}; left:{u(4)}; top:{u(30)}; transform: scaleX(-1) rotate({arm}deg)" />
			{#if held}
				<div class="held" class:shiny={held.type === 'special'} style="top:{u(66)}">
					{@render capsule(held, SIZE)}
					{#if held.type === 'special'}{@render sparkles()}{/if}
				</div>
			{/if}
			<img src={ART.clawHead} alt="" class="head" style="width:{u(56)}" />
		</div>

		{#if falling}
			<div class="piled" style="left:{u(CHUTE_X)}; top:{u(falling.y)}; z-index:160; transform: translate(-50%,-50%)">
				{@render capsule(falling.cap, SIZE)}
			</div>
		{/if}

		<div class="glass"></div>
		<img src={ART.cupboard} alt="" class="frame" />

		{#if tray}
			<button class="tray" class:shiny={tray.type === 'special'} style="left:{u(CHUTE_X)}; top:{u(452)}" onclick={openTray}>
				{@render capsule(tray, 50)}
				<span class="sr-only">Open your capsule</span>
			</button>
		{/if}
	</div>
</div>

<div class="controls">
	{#if phase === 'idle' || phase === 'starting'}
		<button class="btn butter big" onclick={begin} disabled={!canPlay || phase === 'starting'}>
			{phase === 'starting' ? 'Opening the cupboard…' : label}
		</button>
	{:else if phase === 'tray'}
		<p class="hand tap">Your capsule rolled out! Tap it to open.</p>
	{:else}
		<button
			class="mbtn"
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
			{#if phase === 'aim'}Hold the button to slide the claw across. Let go to drop!
				{#if turn > 0}<br /><small class="muted">The claw&rsquo;s a little quicker now&hellip;</small>{/if}
			{:else}Here it comes&hellip;{/if}
		</p>
	{/if}
</div>

<style>
	.machine-wrap {
		position: relative;
		isolation: isolate;
		/* leave room for the header, the buttons and the tab bar so nothing scrolls mid-play */
		width: min(100%, 380px, calc((100svh - 470px) * 360 / 548));
		min-width: 230px;
		margin: 0 auto;
		padding-top: 10px;
	}
	.doily {
		position: absolute;
		top: 0;
		left: 50%;
		width: 62%;
		transform: translateX(-50%);
		z-index: 2;
		pointer-events: none;
	}
	.machine img {
		max-width: none;
	}
	.machine {
		position: relative;
		/* keep the machine's layers from poking through the prize overlay */
		isolation: isolate;
		container-type: inline-size;
		aspect-ratio: 360 / 548;
		user-select: none;
		-webkit-user-select: none;
		touch-action: none;
	}
	.window {
		position: absolute;
		left: calc(28 * 100cqw / 360);
		top: calc(96 * 100cqw / 360);
		width: calc(304 * 100cqw / 360);
		height: calc(276 * 100cqw / 360);
		background:
			linear-gradient(transparent 70%, rgba(201, 138, 74, 0.35)),
			repeating-linear-gradient(90deg, #fbeee0 0 18px, #f8e6d4 18px 36px);
	}
	.window,
	.piled,
	.claw,
	.cable {
		pointer-events: none;
	}
	.piled {
		position: absolute;
		line-height: 0;
	}
	.round {
		display: inline-flex;
		flex-direction: column;
	}
	.round img {
		display: block;
		width: 100%;
	}
	.cable {
		position: absolute;
		z-index: 170;
		width: 3px;
		margin-left: -1.5px;
		background: #9b8a80;
	}
	.claw {
		position: absolute;
		z-index: 171;
		width: 0;
		height: 0;
	}
	.claw .head {
		position: absolute;
		left: 0;
		top: 0;
		transform: translateX(-50%);
		filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.15));
	}
	.claw .arm {
		position: absolute;
		transform-origin: 70% 4%;
	}
	.claw .arm.right {
		transform-origin: 30% 4%;
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
		left: calc(28 * 100cqw / 360);
		top: calc(96 * 100cqw / 360);
		width: calc(304 * 100cqw / 360);
		height: calc(276 * 100cqw / 360);
		z-index: 200;
		pointer-events: none;
		background: linear-gradient(115deg, transparent 20%, rgba(255, 255, 255, 0.35) 22%, rgba(255, 255, 255, 0.12) 30%, transparent 32%, transparent 60%, rgba(255, 255, 255, 0.25) 62%, transparent 66%);
	}
	.frame {
		position: absolute;
		inset: 0;
		width: 100%;
		z-index: 201;
		pointer-events: none;
	}
	.tray {
		all: unset;
		position: absolute;
		z-index: 202;
		transform: translate(-50%, -50%);
		cursor: pointer;
		line-height: 0;
		animation: bounce 0.9s ease-out, nudge 1.4s 1s ease-in-out infinite;
	}
	.tray:focus-visible {
		outline: 3px solid var(--butter);
		border-radius: 50%;
	}
	@keyframes bounce {
		0% {
			transform: translate(-50%, -90%);
		}
		40% {
			transform: translate(-50%, -50%);
		}
		60% {
			transform: translate(-50%, -62%);
		}
		80% {
			transform: translate(-50%, -50%);
		}
	}
	@keyframes nudge {
		0%,
		100% {
			transform: translate(-50%, -50%) rotate(0);
		}
		25% {
			transform: translate(-50%, -50%) rotate(-8deg);
		}
		75% {
			transform: translate(-50%, -50%) rotate(8deg);
		}
	}
	.controls {
		max-width: 380px;
		margin: 10px auto 0;
		text-align: center;
	}
	.big {
		font-size: 1.2rem;
		padding: 14px 40px;
	}
	.tap {
		font-size: 1.6rem;
		margin: 6px 0;
		color: var(--maroon);
	}
	.mbtn {
		width: 100px;
		height: 100px;
		margin: 0 auto;
		border-radius: 50%;
		border: 3px solid var(--maroon-dk);
		background: var(--line);
		color: var(--muted);
		box-shadow: 0 6px 0 var(--maroon-dk);
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
	.mbtn b {
		font: 700 1.1rem var(--display);
		letter-spacing: 0.06em;
		line-height: 1;
	}
	.mbtn svg {
		width: 30px;
		height: 30px;
		fill: none;
		stroke: currentColor;
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.mbtn.live {
		background: var(--pink);
		color: var(--maroon-dk);
		animation: pulse 1.2s ease-in-out infinite;
	}
	.mbtn.live:active {
		transform: translateY(5px);
		box-shadow: 0 1px 0 var(--maroon-dk);
		animation: none;
	}
	.mbtn:disabled {
		cursor: default;
		opacity: 0.7;
	}
	@keyframes pulse {
		50% {
			box-shadow:
				0 6px 0 var(--maroon-dk),
				0 0 0 8px rgba(244, 167, 176, 0.35);
		}
	}
	/* treat-shaped capsules glint gold, like the special plushies */
	.twinkle {
		position: absolute;
		width: 14px;
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
		width: 10px;
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
	.hint {
		margin-top: 14px;
		min-height: 3em;
	}
</style>
