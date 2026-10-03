<script lang="ts">
	import { ART } from '#lib/art.ts';
	import { REWARDS, SHELF, SHELF_DAYS } from '#lib/rewards.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let picked = $state<string | null>(null);
	let item = $derived(SHELF.find((s) => s.key === picked) ?? null);
</script>

<svelte:head><title>The Treat Shelf · Crumb Club</title></svelte:head>

<h1>The Treat Shelf</h1>
<p class="muted">Trade your Crumbs for something guaranteed. You have <b>{data.balance}</b> Crumbs.</p>

{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}

<div class="shelf">
	{#each SHELF as s, i (s.key)}
		{@const r = REWARDS[s.key]}
		{@const ok = data.balance >= s.cost}
		<button class="treat" class:locked={!ok} style="--tilt:{i % 2 ? 1.2 : -1.2}deg" onclick={() => (picked = s.key)}>
			<img src={ART.food[r.art]} alt="" />
			<span class="name">{r.title}</span>
			<span class="short">{r.short}</span>
			<span class="cost">{s.cost} <small>Crumbs</small></span>
			{#if !ok}<span class="need">{s.cost - data.balance} to go</span>{/if}
		</button>
	{/each}
</div>
<div class="plank" aria-hidden="true"></div>

<p class="small muted rules">
	One reward per visit, and percentage discounts can&rsquo;t be combined. Vouchers keep for {SHELF_DAYS} days in your Recipe Book.
</p>

{#if item}
	{@const r = REWARDS[item.key]}
	{@const ok = data.balance >= item.cost}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="overlay" onclick={(e) => e.target === e.currentTarget && (picked = null)}>
		<div class="sheet recipe-card" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
			<img src={ART.food[r.art]} alt="" class="sheet-art" />
			<h2 id="sheet-title">{r.title}</h2>
			<p>{r.terms}</p>
			<p class="small">
				Keeps for {SHELF_DAYS} days.{#if r.maxDiscount} Discount tops out at {r.maxDiscount}.{/if} Show the voucher at the counter
				and staff will scan it.
			</p>
			{#if ok}
				<form method="POST" action="?/redeem">
					<input type="hidden" name="key" value={item.key} />
					<button class="btn block">Trade {item.cost} Crumbs</button>
				</form>
				<p class="small muted after">You&rsquo;ll have {data.balance - item.cost} Crumbs left.</p>
			{:else}
				<p class="error">You need {item.cost - data.balance} more Crumbs for this one.</p>
			{/if}
			<button class="linkish" onclick={() => (picked = null)}>Maybe later</button>
		</div>
	</div>
{/if}

<style>
	.shelf {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px;
		margin-top: 12px;
	}
	.treat {
		all: unset;
		box-sizing: border-box;
		cursor: pointer;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 14px 10px 12px;
		background: var(--paper);
		border: 2px dashed var(--maroon);
		border-radius: 10px;
		box-shadow: var(--shadow);
		transform: rotate(var(--tilt));
		transition: transform 0.12s;
	}
	.treat:hover,
	.treat:focus-visible {
		transform: rotate(0) translateY(-2px);
	}
	.treat:focus-visible {
		outline: 3px solid var(--butter);
	}
	.treat img {
		height: 64px;
		margin-bottom: 6px;
	}
	.name {
		font: 600 1.05rem var(--display);
		color: var(--maroon);
	}
	.short {
		font-family: var(--hand);
		font-size: 1.15rem;
		color: var(--muted);
		line-height: 1;
		margin-bottom: 8px;
	}
	.cost {
		font: 700 1.1rem var(--display);
		background: var(--butter);
		color: var(--maroon-dk);
		border-radius: 999px;
		padding: 2px 12px;
	}
	.cost small {
		font-weight: 400;
		font-size: 0.75rem;
	}
	.locked img {
		filter: grayscale(0.6);
		opacity: 0.6;
	}
	.locked .cost {
		background: var(--cream);
	}
	.need {
		font-size: 0.75rem;
		color: var(--muted);
		margin-top: 4px;
	}
	.plank {
		height: 14px;
		margin: 16px -6px 0;
		background: #8b3a2c;
		border-radius: 3px;
		box-shadow: 0 6px 0 #5e1e1a;
	}
	.rules {
		margin-top: 22px;
	}
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(59, 33, 28, 0.5);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 16px;
	}
	.sheet {
		width: min(480px, 100%);
		margin-bottom: calc(var(--nav-h) - 8px);
		animation: up 0.22s ease-out;
	}
	.sheet-art {
		height: 70px;
	}
	.after {
		text-align: center;
		margin: 6px 0;
	}
	.sheet .linkish {
		display: block;
		margin: 6px auto 0;
	}
	@keyframes up {
		from {
			transform: translateY(40px);
			opacity: 0;
		}
	}
</style>
