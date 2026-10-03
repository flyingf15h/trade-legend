<script lang="ts">
	import { page } from '$app/state';
	import { ART } from '#lib/art.ts';
	import { REWARDS } from '#lib/rewards.ts';
	import { shortDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let tab = $derived(page.url.searchParams.get('tab') === 'history' ? 'history' : 'vouchers');
	let open = $state<string | null>(page.url.searchParams.get('new'));
	const fresh = page.url.searchParams.get('new');

	const SOURCE: Record<string, string> = { shelf: 'From the Treat Shelf', cupboard: 'From the Lucky Cupboard', birthday: 'Happy birthday!' };
	const KIND: Record<string, string> = {
		purchase: '🧾',
		return: '↩︎',
		vote: '🥄',
		referral: '💌',
		review: '⭐',
		cupboard: '🎁',
		redeem: '🍪'
	};
	const fmt = (centi: number) => {
		const v = centi / 100;
		const n = Number.isInteger(v) ? String(Math.abs(v)) : Math.abs(v).toFixed(2);
		return (v >= 0 ? '+' : '−') + n;
	};
</script>

<svelte:head><title>{tab === 'history' ? 'Crumb History' : 'My Rewards'} · Crumb Club</title></svelte:head>


{#if fresh}
	<p class="note fresh center">One treat, on Grandma. You&rsquo;ve earned it!</p>
{/if}

<div class="tabs" role="tablist">
	<a role="tab" href="?" aria-selected={tab === 'vouchers'} data-sveltekit-replacestate data-sveltekit-noscroll>Rewards ({data.ready.length})</a>
	<a role="tab" href="?tab=history" aria-selected={tab === 'history'} data-sveltekit-replacestate data-sveltekit-noscroll>Crumb History</a>
</div>

{#if tab === 'vouchers'}
	{#if data.ready.length === 0}
		<div class="empty card">
			<img src={ART.food.cookie} alt="" />
			<p>No treats tucked in here yet.</p>
			<a href="/treats" class="btn soft">Visit the Treat Shelf</a>
		</div>
	{/if}
	{#each data.ready as v (v.code)}
		{@const r = REWARDS[v.rewardKey]}
		<article class="voucher" id={v.code} class:fresh={v.code === fresh}>
			<button class="v-head" onclick={() => (open = open === v.code ? null : v.code)} aria-expanded={open === v.code}>
				<img src={ART.food[r.art]} alt="" />
				<span class="v-text">
					<b>{r.title}</b>
					<span class="hand">{SOURCE[v.source]}</span>
					<small>Use by {shortDate(v.expiresAt)}</small>
				</span>
				<span class="v-show">{open === v.code ? 'Hide' : 'Use'}</span>
			</button>
			{#if open === v.code}
				<div class="v-body">
					<div class="qr">{@html v.qr}</div>
					<p class="code">{v.code}</p>
					<p class="small">{r.terms}</p>
					<p class="small muted">Show this to staff at the counter. It&rsquo;s marked used once they scan it.</p>
				</div>
			{/if}
		</article>
	{/each}

	{#if data.past.length}
		<h2 class="past-h">Already enjoyed</h2>
		<ul class="past">
			{#each data.past as v (v.code)}
				<li>
					<span>{REWARDS[v.rewardKey].title}</span>
					<span class="pill">{v.status === 'used' ? `used ${shortDate(v.usedAt ?? v.createdAt)}` : v.status}</span>
				</li>
			{/each}
		</ul>
	{/if}
{:else}
	<ol class="receipt">
		<li class="r-head">
			<span>GRANDMA&rsquo;S BAKERY</span>
			<span>Crumb Club statement</span>
		</li>
		{#each data.history as h (h.id)}
			<li class="r-line">
				<span class="r-date">{shortDate(h.createdAt)}</span>
				<span class="r-note"><span aria-hidden="true">{KIND[h.kind] ?? '•'}</span> {h.note}.</span>
				<span class="r-amt" class:neg={h.centi < 0}>{fmt(h.centi)}</span>
			</li>
		{/each}
		<li class="r-total">
			<span>Balance</span>
			<b>{data.balance} Crumbs</b>
		</li>
	</ol>
{/if}

<style>
	.fresh.note {
		margin: 8px 0 18px;
	}
	.tabs {
		display: flex;
		gap: 6px;
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 4px;
		margin: 6px 0 16px;
	}
	.tabs a {
		flex: 1;
		text-align: center;
		text-decoration: none;
		font: 800 0.95rem var(--body);
		color: var(--muted);
		padding: 9px;
		border-radius: 999px;
	}
	.tabs a[aria-selected='true'] {
		background: var(--butter);
		color: #5b4618;
	}
	.empty {
		text-align: center;
	}
	.empty img {
		height: 60px;
	}
	.voucher {
		position: relative;
		background: var(--paper);
		border: 2px dashed var(--maroon);
		border-radius: 12px;
		margin-bottom: 12px;
		box-shadow: var(--shadow);
		overflow: hidden;
	}
	.voucher::before,
	.voucher::after {
		content: '';
		position: absolute;
		top: 34px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--bg);
		border: 2px dashed var(--maroon);
	}
	.voucher::before {
		left: -11px;
	}
	.voucher::after {
		right: -11px;
	}
	.voucher.fresh {
		animation: glow 1.6s ease-out 2;
	}
	@keyframes glow {
		50% {
			box-shadow: 0 0 0 6px rgba(242, 201, 76, 0.6);
		}
	}
	.v-head {
		all: unset;
		box-sizing: border-box;
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 18px;
		cursor: pointer;
	}
	.v-head img {
		width: 52px;
		height: 52px;
	}
	.v-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}
	.v-text b {
		font: 600 1.1rem var(--display);
		color: var(--maroon);
	}
	.v-text .hand {
		font-size: 1.1rem;
	}
	.v-text small {
		color: var(--muted);
	}
	.v-show {
		font: 600 0.85rem var(--display);
		background: var(--maroon);
		color: var(--paper);
		border-radius: 999px;
		padding: 6px 14px;
	}
	.v-body {
		text-align: center;
		padding: 4px 18px 16px;
		border-top: 1px dashed var(--line);
	}
	.qr {
		width: 190px;
		height: 190px;
		margin: 10px auto 0;
	}
	.qr :global(svg) {
		width: 100%;
		height: 100%;
	}
	.code {
		font: 600 1.05rem var(--display);
		letter-spacing: 0.08em;
		margin: 0 0 8px;
	}
	.past-h {
		margin-top: 22px;
		font-size: 1.05rem;
	}
	.past {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.past li {
		display: flex;
		justify-content: space-between;
		padding: 8px 2px;
		border-bottom: 1px dashed var(--line);
		color: var(--muted);
	}
	.receipt {
		list-style: none;
		margin: 0;
		padding: 18px 16px 22px;
		background: #fff;
		font-size: 0.9rem;
		box-shadow: var(--shadow);
		/* torn paper edges */
		mask:
			conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 14px 51% repeat-x,
			conic-gradient(from 135deg at top, #0000, #000 1deg 89deg, #0000 90deg) top / 14px 51% repeat-x;
	}
	.r-head {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-family: ui-monospace, 'Courier New', monospace;
		letter-spacing: 0.08em;
		border-bottom: 2px dashed var(--line);
		padding-bottom: 10px;
		margin-bottom: 6px;
	}
	.r-head span:first-child {
		font-weight: 700;
		color: var(--maroon);
	}
	.r-line {
		display: grid;
		grid-template-columns: 52px 1fr auto;
		gap: 8px;
		padding: 7px 0;
		border-bottom: 1px dotted var(--line);
	}
	.r-date {
		color: var(--muted);
		font-size: 0.8rem;
	}
	.r-amt {
		font: 700 0.95rem var(--display);
		color: var(--olive);
		white-space: nowrap;
	}
	.r-amt.neg {
		color: var(--red);
	}
	.r-total {
		display: flex;
		justify-content: space-between;
		padding-top: 10px;
		margin-top: 4px;
		border-top: 2px dashed var(--line);
		font-family: var(--display);
	}
</style>
