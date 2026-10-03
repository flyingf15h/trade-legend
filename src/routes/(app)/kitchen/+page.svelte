<script lang="ts">
	import CookieJar from '#lib/components/CookieJar.svelte';
	import { ART } from '#lib/art.ts';
	import { EARN, PLAY_COST, SHELF } from '#lib/rewards.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let next = $derived(SHELF.find((s) => s.cost > data.balance) ?? null);
	let prev = $derived([...SHELF].reverse().find((s) => s.cost <= data.balance)?.cost ?? 0);
	let progress = $derived(next ? (data.balance - prev) / (next.cost - prev) : 1);
</script>

<svelte:head><title>Crumb Club</title></svelte:head>

<h1 class="hi">Hi {data.member.name} <span aria-hidden="true">♡</span></h1>

<CookieJar {progress} />

<div class="count">
	<p class="crumbs">{data.balance} Crumbs</p>
	<p class="hand to-go">
		{#if next}{next.cost - data.balance} until your next reward{:else}Every treat on the shelf is yours{/if} ✨
	</p>
</div>

{#if data.boosts > 0}
	<p class="pill butter boost">✨ Double Crumbs on your next purchase</p>
{/if}

<div class="actions">
	<a href="/cupboard" class="action yellow">
		<span class="emoji" aria-hidden="true">🎲</span>
		<span class="label">Play</span>
		<span class="pill">{data.freePlay ? '1 free pull' : `${PLAY_COST} Crumbs`}</span>
	</a>
	<a href="/tasting" class="action pink">
		<span class="emoji" aria-hidden="true">🥧</span>
		<span class="label">Vote</span>
		<span class="pill">{data.ballot && !data.ballot.voted ? `+${EARN.vote} Crumbs` : data.ballot ? 'Voted ✓' : 'Archive'}</span>
	</a>
	<a href="/treats" class="action mint">
		<span class="emoji" aria-hidden="true">🥐</span>
		<span class="label">Treats</span>
		<span class="pill">View rewards</span>
	</a>
</div>

{#if data.readyCount > 0}
	<a href="/recipe-book" class="ready panel">
		<img src={ART.food.croissant} alt="" />
		<span><b>{data.readyCount} treat{data.readyCount === 1 ? '' : 's'} ready</b><small>Show it at the counter</small></span>
		<span class="chev" aria-hidden="true">›</span>
	</a>
{/if}

{#if data.featured}
	<section class="featured panel">
		<img src={ART.food[data.featured.art]} alt="" />
		<div>
			<span class="tag">Flavour of the month</span>
			<h3>{data.featured.name}</h3>
			<p class="small muted">{data.featured.dish}</p>
		</div>
	</section>
{/if}

<style>
	.hi {
		text-align: center;
		font-size: 2.4rem;
		margin: 4px 0 10px;
	}
	.hi span {
		font-family: var(--body);
		font-size: 0.8em;
	}
	.count {
		text-align: center;
		margin: 12px 0 20px;
	}
	.crumbs {
		font: 400 2.2rem/1 var(--display);
		margin: 0 0 6px;
	}
	.to-go {
		font-size: 1.25rem;
		letter-spacing: 0.06em;
		margin: 0;
	}
	.boost {
		display: flex;
		justify-content: center;
		margin: -6px auto 16px;
		width: fit-content;
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.action {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 16px 0 18px;
		height: 74px;
		border: 2px solid var(--ink);
		border-radius: 22px;
		box-shadow: var(--shadow);
		color: var(--ink);
		text-decoration: none;
		transition: transform 0.1s, box-shadow 0.1s;
	}
	.action:active {
		transform: translate(2px, 3px);
		box-shadow: 1px 1px 0 var(--ink);
	}
	.yellow {
		background: #fdf1bf;
	}
	.pink {
		background: var(--pink);
	}
	.mint {
		background: var(--mint);
	}
	.emoji {
		font-size: 1.9rem;
	}
	.label {
		flex: 1;
		font: 400 1.9rem var(--display);
	}
	.action .pill {
		font-size: 0.9rem;
		padding: 6px 14px;
		box-shadow: 1px 2px 0 var(--ink);
	}
	.ready {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-top: 22px;
		color: inherit;
		text-decoration: none;
	}
	.ready img {
		width: 44px;
	}
	.ready span:not(.chev) {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.ready small {
		color: var(--muted);
	}
	.chev {
		font-size: 1.6rem;
		color: var(--muted);
	}
	.featured {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 14px;
	}
	.featured img {
		width: 64px;
		flex: none;
	}
	.featured h3 {
		margin: 2px 0;
	}
	.featured p {
		margin: 0;
	}
	.tag {
		font: 800 0.72rem var(--body);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--maroon);
	}
</style>
