<script lang="ts">
	import { onMount } from 'svelte';
	import { ART } from '#lib/art.ts';
	import { PLAY_COST, REWARDS, type Prize } from '#lib/rewards.ts';
	import { shortDate } from '#lib/format.ts';
	import type { Capsule } from './ClawMachine.svelte';

	let {
		capsule,
		prize,
		label,
		voucher,
		balance,
		onagain,
		onclose
	}: {
		capsule: Capsule;
		prize: Prize;
		label: string;
		voucher: { code: string; expiresAt: string } | null;
		balance: number;
		onagain: () => void;
		onclose: () => void;
	} = $props();

	// closed -> wobbling -> open
	let stage = $state<'closed' | 'wobble' | 'open'>('closed');
	let dialog: HTMLDivElement;

	onMount(() => dialog.focus());

	function crack() {
		if (stage !== 'closed') return;
		stage = 'wobble';
		setTimeout(() => (stage = 'open'), 1250);
	}

	const sparkles = Array.from({ length: 14 }, (_, i) => ({
		angle: (360 / 14) * i + (i % 2) * 9,
		dist: 120 + (i % 3) * 36,
		size: 18 + (i % 4) * 7,
		delay: (i % 5) * 0.04
	}));

	let art = $derived(
		prize.kind === 'crumbs' || prize.kind === 'double' ? ART.cookieFace : ART.food[REWARDS[prize.reward].art]
	);
	let special = $derived(capsule.type === 'special');
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="overlay" role="dialog" aria-modal="true" aria-label="Open your capsule" tabindex="-1" bind:this={dialog}>
	<button class="close" onclick={onclose} aria-label="Close">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
	</button>
	<div class="stage">
		{#if stage === 'open'}
			<div class="rays" class:gold={special} aria-hidden="true"></div>
			{#each sparkles as s, i (i)}
				<img
					src={ART.twinkle}
					alt=""
					class="sparkle"
					style="--a:{s.angle}deg; --d:{s.dist}px; width:{s.size}px; animation-delay:{s.delay}s"
				/>
			{/each}
		{/if}

		{#if stage !== 'open'}
			<button class="capsule {stage}" onclick={crack} aria-label="Tap to open">
				{#if capsule.type === 'special'}
					<img src={ART.capsuleSpecial[capsule.shape]} alt="" class="whole" />
				{:else}
					<img src={ART.capsuleTop} alt="" class="half" />
					<img src={ART.capsuleBottom[capsule.colour]} alt="" class="half" />
				{/if}
			</button>
			<p class="hand prompt">{stage === 'closed' ? (special ? 'Ooh, a special one! Tap to open' : 'Tap to open!') : '…'}</p>
		{:else}
			{#if capsule.type === 'round'}
				<img src={ART.capsuleTop} alt="" class="fly top" />
				<img src={ART.capsuleBottom[capsule.colour]} alt="" class="fly bottom" />
			{:else}
				<img src={ART.capsuleSpecial[capsule.shape]} alt="" class="fly pop" />
			{/if}
			<div class="prize">
				<img src={art} alt="" />
				<h2>{prize.kind === 'crumbs' ? `+${prize.amount} Crumbs!` : prize.kind === 'double' ? 'Double Crumbs!' : `${label}!`}</h2>
				{#if prize.kind === 'voucher'}
					<p>{REWARDS[prize.reward].terms}</p>
					<p class="small muted">Saved in My Rewards{voucher ? `, good until ${shortDate(voucher.expiresAt)}` : ''}.</p>
				{:else if prize.kind === 'double'}
					<p>Your next purchase earns double Crumbs. Grandma will remember!</p>
				{:else}
					<p class="small muted">Added to your Crumbs. You now have {balance}.</p>
				{/if}
			</div>
		{/if}
	</div>

	{#if stage === 'open'}
		<div class="actions">
			<button class="btn salmon block yay" onclick={onclose}>Yay!</button>
			{#if prize.kind === 'voucher'}
				<a class="btn soft quiet block" href="/recipe-book{voucher ? `#${voucher.code}` : ''}">See it in My Rewards</a>
			{/if}
			{#if balance >= PLAY_COST}
				<button class="linkish" onclick={onagain}>Play again for {PLAY_COST} Crumbs</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: var(--bg);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 16px 24px calc(24px + env(safe-area-inset-bottom));
		color: var(--ink);
		outline: none;
	}
	.close {
		position: absolute;
		top: calc(16px + env(safe-area-inset-top));
		left: 16px;
		width: 44px;
		height: 44px;
		border: 0;
		background: none;
		color: var(--ink);
		cursor: pointer;
	}
	.close svg {
		width: 28px;
		height: 28px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.5;
		stroke-linecap: round;
	}
	.stage {
		position: relative;
		margin-top: auto;
		width: min(340px, 100%);
		min-height: 360px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.capsule {
		all: unset;
		cursor: pointer;
		width: 180px;
		display: flex;
		flex-direction: column;
		animation: float 2s ease-in-out infinite;
	}
	.capsule:focus-visible {
		outline: 3px solid var(--butter);
		border-radius: 50%;
	}
	.capsule .half {
		width: 100%;
		display: block;
	}
	.capsule .whole {
		width: 100%;
	}
	.capsule.wobble {
		animation: wobble 1.25s ease-in-out;
	}
	@keyframes float {
		50% {
			transform: translateY(-10px);
		}
	}
	@keyframes wobble {
		0%,
		100% {
			transform: rotate(0) scale(1);
		}
		10% {
			transform: rotate(-14deg);
		}
		25% {
			transform: rotate(12deg);
		}
		40% {
			transform: rotate(-10deg) scale(1.04);
		}
		55% {
			transform: rotate(10deg) scale(1.06);
		}
		70% {
			transform: rotate(-6deg) scale(1.1);
		}
		85% {
			transform: rotate(4deg) scale(1.16);
		}
	}
	.prompt {
		margin-top: 20px;
		font-size: 1.7rem;
		color: var(--maroon);
	}
	.fly {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 180px;
		pointer-events: none;
	}
	.fly.top {
		animation: flyTop 0.9s ease-out forwards;
	}
	.fly.bottom {
		animation: flyBottom 0.9s ease-in forwards;
	}
	.fly.pop {
		animation: pop 0.6s ease-out forwards;
	}
	@keyframes flyTop {
		from {
			transform: translate(-50%, -100%);
		}
		to {
			transform: translate(-90%, -320%) rotate(-70deg);
			opacity: 0;
		}
	}
	@keyframes flyBottom {
		from {
			transform: translate(-50%, 0);
		}
		to {
			transform: translate(-10%, 260%) rotate(40deg);
			opacity: 0;
		}
	}
	@keyframes pop {
		from {
			transform: translate(-50%, -50%) scale(1);
			filter: brightness(1);
		}
		40% {
			transform: translate(-50%, -50%) scale(1.25);
			filter: brightness(2.5);
		}
		to {
			transform: translate(-50%, -50%) scale(1.6);
			opacity: 0;
			filter: brightness(3);
		}
	}
	.rays {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 560px;
		height: 560px;
		margin: -280px 0 0 -280px;
		border-radius: 50%;
		background: repeating-conic-gradient(rgba(251, 232, 166, 0.55) 0 10deg, transparent 10deg 24deg);
		mask: radial-gradient(circle, #000 20%, transparent 68%);
		animation: spin 12s linear infinite, fadeIn 0.6s ease-out;
		pointer-events: none;
	}
	.rays.gold {
		background: repeating-conic-gradient(rgba(242, 201, 76, 0.45) 0 10deg, transparent 10deg 24deg);
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.4);
		}
	}
	.sparkle {
		position: absolute;
		top: 50%;
		left: 50%;
		pointer-events: none;
		animation: burst 1.1s ease-out both;
	}
	@keyframes burst {
		from {
			transform: translate(-50%, -50%) rotate(var(--a)) translateY(0) scale(0.2);
			opacity: 1;
		}
		70% {
			opacity: 1;
		}
		to {
			transform: translate(-50%, -50%) rotate(var(--a)) translateY(calc(-1 * var(--d))) scale(1);
			opacity: 0;
		}
	}
	.prize {
		position: relative;
		text-align: center;
		width: 100%;
		animation: rise 0.6s 0.25s cubic-bezier(0.2, 1.4, 0.4, 1) both;
	}
	.prize img {
		height: 150px;
	}
	.prize h2 {
		font-size: 2.8rem;
		color: var(--maroon);
		margin: 26px 0 8px;
	}
	@keyframes rise {
		from {
			transform: scale(0.3) translateY(40px);
			opacity: 0;
		}
	}
	.actions {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		width: min(380px, 100%);
		animation: fadeIn 0.4s 0.8s both;
	}
	.actions .btn {
		width: 100%;
	}
	.yay {
		font-size: 1.7rem;
		padding: 18px;
	}
</style>
