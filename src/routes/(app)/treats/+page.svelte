<script lang="ts">
	import { ART } from '#lib/art.ts';
	import { REWARDS, SHELF, SHELF_DAYS } from '#lib/rewards.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let picked = $state<string | null>(null);
	let item = $derived(SHELF.find((s) => s.key === picked) ?? null);
</script>

<svelte:head><title>Treat Shelf · Crumb Club</title></svelte:head>

<h1 class="title">
	Pick a little treat <img src={ART.icon.heart} alt="" class="px-ico" />
	<img src={ART.sparkle} alt="" class="spark s1" />
	<img src={ART.sparkle} alt="" class="spark s2" />
</h1>

{#if form?.error}<p class="error center" role="alert">{form.error}</p>{/if}

<div class="shelf">
	{#each SHELF as s, i (s.key)}
		{@const r = REWARDS[s.key]}
		{@const ok = data.balance >= s.cost}
		<article class="card treat">
			<div class="pic"><img src={ART.food[r.art]} alt="" /></div>
			<h2>{r.title}</h2>
			<p class="cost">{s.cost} Crumbs</p>
			<button class="btn quiet block {i % 2 ? 'butter' : 'pinkish'}" disabled={!ok} onclick={() => (picked = s.key)}>
				{ok ? 'Redeem' : `${s.cost - data.balance} more Crumbs`}
			</button>
		</article>
	{/each}
</div>

<p class="small muted center rules">
	One reward per visit. Percentage discounts can&rsquo;t be combined. Treats keep for {SHELF_DAYS} days.
</p>

{#if item}
	{@const r = REWARDS[item.key]}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="overlay" onclick={(e) => e.target === e.currentTarget && (picked = null)}>
		<div class="sheet card" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
			<img src={ART.food[r.art]} alt="" class="sheet-art" />
			<h2 id="sheet-title">{r.title}</h2>
			<p>{r.terms}</p>
			<p class="small muted">
				Keeps for {SHELF_DAYS} days.{#if r.maxDiscount} Takes up to {r.maxDiscount} off.{/if} Staff scan it at the counter.
			</p>
			<form method="POST" action="?/redeem">
				<input type="hidden" name="key" value={item.key} />
				<button class="btn block">Trade {item.cost} Crumbs</button>
			</form>
			<p class="small muted center left">You&rsquo;ll have {data.balance - item.cost} Crumbs left.</p>
			<button class="linkish later" onclick={() => (picked = null)}>Maybe later</button>
		</div>
	</div>
{/if}

<style>
	.title {
		text-align: center;
		font-size: 2.3rem;
		margin: 14px 0 22px;
	}
	.title {
		position: relative;
	}
	.spark {
		position: absolute;
		width: 16px;
		opacity: 0.8;
		pointer-events: none;
	}
	.s1 {
		right: -4px;
		top: -14px;
	}
	.s2 {
		left: -6px;
		bottom: -22px;
	}
	.shelf {
		display: flex;
		flex-direction: column;
		gap: 22px;
	}
	.treat {
		text-align: center;
		padding: 22px 22px 20px;
		border-radius: 30px;
	}
	.pic {
		height: 120px;
		display: grid;
		place-items: center;
		margin-bottom: 10px;
	}
	.pic img {
		max-height: 110px;
	}
	.treat h2 {
		font-size: 1.75rem;
		margin-bottom: 2px;
	}
	.cost {
		color: var(--muted);
		font-size: 1.1rem;
		margin-bottom: 14px;
	}
	.treat .btn {
		font-weight: 600;
		font-size: 1.1rem;
		padding: 13px;
	}
	.treat .btn:disabled {
		opacity: 0.6;
		background: #f1ece8;
		box-shadow: none;
	}
	.rules {
		margin-top: 24px;
	}
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(58, 42, 37, 0.45);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
	}
	.sheet {
		width: min(420px, 100%);
		text-align: center;
		animation: up 0.22s ease-out;
	}
	.sheet-art {
		height: 80px;
	}
	.left {
		margin: 8px 0 4px;
	}
	.later {
		display: block;
		margin: 4px auto 0;
	}
	@keyframes up {
		from {
			transform: translateY(40px);
			opacity: 0;
		}
	}
</style>
