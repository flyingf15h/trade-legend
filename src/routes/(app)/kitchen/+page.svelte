<script lang="ts">
	import { ART } from '#lib/art.ts';
	import { EARN, PLAY_COST, REWARDS, SHELF } from '#lib/rewards.ts';
	import { shortDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let showCard = $state(false);

	const hour = new Date().getHours();
	const hello = hour < 11 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

	let next = $derived(SHELF.find((s) => s.cost > data.balance) ?? null);
	let affordable = $derived(SHELF.filter((s) => s.cost <= data.balance).length);
	let progress = $derived(next ? Math.min(100, (data.balance / next.cost) * 100) : 100);
</script>

<svelte:head><title>Grandma&rsquo;s Kitchen · Crumb Club</title></svelte:head>

<h1>{hello}, {data.member.name}!</h1>
<p class="muted lead">Grandma&rsquo;s Kitchen</p>

<!-- membership card -->
<button class="member-card" onclick={() => (showCard = true)} aria-label="Show my membership card">
	<div class="gingham edge" aria-hidden="true"></div>
	<div class="mc-body">
		<div class="mc-left">
			<span class="mc-label">Crumb Club member</span>
			<span class="mc-name">{data.member.name}</span>
			<span class="mc-balance"><b>{data.balance}</b> Crumbs <small>loyalty points</small></span>
			<span class="mc-hint">Tap to show at the counter</span>
		</div>
		<div class="mc-qr">{@html data.qr}</div>
	</div>
</button>

{#if data.boosts > 0}
	<p class="boost pill butter">Double Crumbs on your next purchase{data.boosts > 1 ? ` (x${data.boosts})` : ''}!</p>
{/if}

<!-- next reward -->
<section class="card progress-card">
	{#if next}
		<div class="spread">
			<h2>Saving up for {REWARDS[next.key].title.toLowerCase()}</h2>
			<img src={ART.food[REWARDS[next.key].art]} alt="" class="goal-art" />
		</div>
		<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={next.cost} aria-valuenow={data.balance}>
			<div style="width:{progress}%"></div>
		</div>
		<p class="small muted">{next.cost - data.balance} more Crumbs to go, about ${Math.ceil((next.cost - data.balance) / EARN.crumbsPerDollar)} of treats.</p>
	{:else}
		<h2>The whole shelf is yours!</h2>
		<p class="small muted">You have enough Crumbs for anything on the Treat Shelf.</p>
	{/if}
	<a href="/treats" class="btn soft block">
		Visit the Treat Shelf{affordable ? ` · ${affordable} ready to trade` : ''}
	</a>
</section>

<!-- daily play + vote -->
<div class="duo">
	<a href="/cupboard" class="card tile cupboard-tile">
		<img src={ART.capsuleTop.pink} alt="" class="cap" />
		<h3>Lucky Cupboard</h3>
		{#if data.freePlay}
			<span class="pill mint">Free play today</span>
		{:else}
			<span class="pill">Play for {PLAY_COST} Crumbs</span>
		{/if}
	</a>
	<a href="/tasting" class="card tile">
		<img src={ART.food.parfait} alt="" class="cap" />
		<h3>Tasting Table</h3>
		{#if data.ballot && !data.ballot.voted}
			<span class="pill butter">Vote for +{EARN.vote}</span>
		{:else if data.ballot}
			<span class="pill">Voted · results {shortDate(data.ballot.closesOn)}</span>
		{:else}
			<span class="pill">Recipe archive</span>
		{/if}
	</a>
</div>

{#if data.featured}
	<section class="card featured">
		<span class="ribbon">Flavour of the month</span>
		<div class="row">
			<img src={ART.food[data.featured.art]} alt="" />
			<div>
				<h2>{data.featured.name}</h2>
				<p class="dish">{data.featured.dish}</p>
				<p class="small">{data.featured.description}</p>
			</div>
		</div>
	</section>
{/if}

{#if data.readyCount > 0}
	<section class="ready">
		<div class="spread">
			<h2>Ready to enjoy</h2>
			<a href="/recipe-book" class="small">See all {data.readyCount}</a>
		</div>
		{#each data.ready as v (v.code)}
			<a href="/recipe-book#{v.code}" class="coupon">
				<img src={ART.food[REWARDS[v.rewardKey].art]} alt="" />
				<span><b>{REWARDS[v.rewardKey].title}</b><small>use by {shortDate(v.expiresAt)}</small></span>
			</a>
		{/each}
	</section>
{/if}

<section class="earn">
	<h2>More ways to earn</h2>
	<ul class="recipe-card">
		<li><span>Shop at Grandma&rsquo;s</span><b>5 per $1</b></li>
		<li><a href="/tasting">Vote on next month&rsquo;s flavour</a><b>+{EARN.vote}</b></li>
		<li><a href="/invite">Bring a neighbour</a><b>+{EARN.referrer}</b></li>
		<li>
			<a href="/me#review">Post a review</a>
			<b>{data.review === 'approved' ? 'done!' : data.review === 'pending' ? 'checking…' : `+${EARN.review}`}</b>
		</li>
		<li><a href="/me#birthday">Birthday week pastry</a><b>free</b></li>
	</ul>
</section>

<p class="note sign">Have a lovely day, dear. Don&rsquo;t forget your scarf! <br />&mdash; Grandma</p>

{#if showCard}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="overlay" onclick={() => (showCard = false)}>
		<div class="big-card" role="dialog" aria-label="Membership card">
			<img src={ART.avatar[data.member.icon]} alt="" class="big-avatar" />
			<h2>{data.member.name}</h2>
			<div class="big-qr">{@html data.qr}</div>
			<p class="code">{data.member.cardCode}</p>
			<p class="small muted">Show this at the counter to earn or spend Crumbs.</p>
			<button class="btn soft" onclick={() => (showCard = false)}>Done</button>
		</div>
	</div>
{/if}

<style>
	h1 {
		margin-bottom: 0;
	}
	.lead {
		font-family: var(--hand);
		font-size: 1.3rem;
		margin: 0 0 14px;
	}
	.member-card {
		all: unset;
		box-sizing: border-box;
		display: block;
		width: 100%;
		cursor: pointer;
		background: var(--maroon);
		color: var(--paper);
		border-radius: 18px;
		overflow: hidden;
		box-shadow: 0 10px 24px rgba(94, 30, 26, 0.25);
		margin-bottom: 14px;
	}
	.member-card:focus-visible {
		outline: 3px solid var(--butter);
	}
	.edge {
		height: 14px;
	}
	.mc-body {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px 18px 18px;
	}
	.mc-left {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.mc-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		opacity: 0.8;
	}
	.mc-name {
		font: 600 1.4rem var(--display);
	}
	.mc-balance b {
		font: 700 2.2rem var(--display);
		color: var(--butter);
	}
	.mc-balance small {
		display: block;
		font-size: 0.75rem;
		opacity: 0.75;
		margin-top: -4px;
	}
	.mc-hint {
		font-family: var(--hand);
		font-size: 1.1rem;
		opacity: 0.85;
		margin-top: 4px;
	}
	.mc-qr {
		width: 108px;
		height: 108px;
		background: var(--paper);
		border-radius: 12px;
		padding: 6px;
		flex: none;
	}
	.mc-qr :global(svg),
	.big-qr :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
	.boost {
		display: block;
		text-align: center;
		margin: 0 0 14px;
		padding: 6px 12px;
	}
	.progress-card {
		margin-bottom: 14px;
	}
	.progress-card h2 {
		font-size: 1.1rem;
	}
	.goal-art {
		width: 48px;
		height: 48px;
	}
	.bar {
		height: 14px;
		border-radius: 999px;
		background: var(--cream);
		border: 1.5px solid var(--line);
		overflow: hidden;
		margin: 6px 0 6px;
	}
	.bar div {
		height: 100%;
		border-radius: 999px;
		background: repeating-linear-gradient(-45deg, var(--butter) 0 8px, #f6d77a 8px 16px);
	}
	.duo {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-bottom: 14px;
	}
	.tile {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		text-decoration: none;
		color: inherit;
		padding: 14px;
		transition: transform 0.12s;
	}
	.tile:active {
		transform: scale(0.98);
	}
	.tile h3 {
		margin: 0;
	}
	.tile .cap {
		height: 46px;
	}
	.cupboard-tile {
		background: linear-gradient(var(--paper), #fdf1e7);
	}
	.featured {
		position: relative;
		margin-bottom: 14px;
		padding-top: 26px;
	}
	.ribbon {
		position: absolute;
		top: -10px;
		left: 16px;
		background: var(--red);
		color: var(--paper);
		font: 600 0.8rem var(--display);
		padding: 4px 12px;
		border-radius: 4px;
		transform: rotate(-2deg);
	}
	.featured img {
		width: 86px;
		flex: none;
	}
	.featured .dish {
		font-family: var(--hand);
		font-size: 1.25rem;
		margin: -4px 0 4px;
	}
	.featured p.small {
		margin: 0;
	}
	.ready {
		margin-bottom: 18px;
	}
	.coupon {
		display: flex;
		align-items: center;
		gap: 12px;
		background: var(--paper);
		border: 2px dashed var(--maroon);
		border-radius: 12px;
		padding: 8px 12px;
		margin-bottom: 8px;
		color: inherit;
		text-decoration: none;
	}
	.coupon img {
		width: 40px;
		height: 40px;
	}
	.coupon span {
		display: flex;
		flex-direction: column;
	}
	.coupon small {
		color: var(--muted);
	}
	.earn ul {
		list-style: none;
		margin: 0 0 22px;
	}
	.earn li {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		line-height: 28px;
	}
	.earn b {
		font-family: var(--display);
		color: var(--maroon);
	}
	.sign {
		margin: 8px 12px 0;
		text-align: center;
	}
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(59, 33, 28, 0.55);
		display: grid;
		place-items: center;
		padding: 16px;
	}
	.big-card {
		background: var(--paper);
		border-radius: 20px;
		padding: 22px;
		width: min(360px, 100%);
		text-align: center;
	}
	.big-avatar {
		width: 64px;
	}
	.big-qr {
		width: 240px;
		height: 240px;
		margin: 6px auto;
	}
	.code {
		font: 600 1.1rem var(--display);
		letter-spacing: 0.08em;
		margin: 0;
	}
</style>
