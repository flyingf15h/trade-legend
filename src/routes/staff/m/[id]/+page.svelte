<script lang="ts">
	import { enhance } from '$app/forms';
	import { ART } from '#lib/art.ts';
	import { money, prettyPhone, shortDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>{data.m.name} · Counter</title></svelte:head>

<section class="who">
	<img src={ART.avatar[data.m.icon]} alt="" />
	<div>
		<h1>{data.m.name}</h1>
		<p class="muted">{prettyPhone(data.m.phone)} · {data.m.cardCode}</p>
	</div>
	<div class="bal"><b>{data.balance}</b><span>Crumbs</span></div>
</section>

{#if data.boosts}<p class="pill butter">Double Crumbs on this purchase ({data.boosts} saved)</p>{/if}

{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
{#if form && 'earned' in form}<p class="ok">+{form.earned} Crumbs added{form.doubled ? ' (doubled!)' : ''}.</p>{/if}
{#if form && 'returned' in form}<p class="ok">Return done. {form.returned} Crumbs taken back.</p>{/if}
{#if form && 'used' in form}<p class="ok">{form.used} marked as used.</p>{/if}

<form method="POST" action="?/purchase" use:enhance class="card">
	<h2>Award Crumbs for a purchase</h2>
	<div class="grid">
		<label class="field"
			><span>Amount paid <small>after discounts, before tax and tip</small></span>
			<input name="amount" inputmode="decimal" placeholder="12.50" required /></label
		>
		<label class="field"><span>What they got <small>optional, shows on their receipt</small></span>
			<input name="description" placeholder="A latte and a croissant" /></label
		>
	</div>
	<button class="btn">Add Crumbs</button>
</form>

<section class="card">
	<h2>Treats ready to use</h2>
	{#if data.ready.length === 0}<p class="muted">None right now.</p>{/if}
	{#each data.ready as v (v.code)}
		<form method="POST" action="?/use" use:enhance class="line">
			<span><b>{v.title}</b> <small class="muted">{v.code} · until {shortDate(v.expiresAt)}</small></span>
			<input type="hidden" name="code" value={v.code} />
			<button class="btn soft">Use</button>
		</form>
	{/each}
</section>

<section class="card">
	<h2>Recent purchases</h2>
	{#if data.purchases.length === 0}<p class="muted">None yet.</p>{/if}
	{#each data.purchases as p (p.id)}
		<form method="POST" action="?/return" use:enhance class="line">
			<span>{shortDate(p.createdAt)} · {money(p.eligibleCents)} {p.description ? `· ${p.description}` : ''}</span>
			{#if p.returned}
				<span class="pill">returned</span>
			{:else}
				<input type="hidden" name="purchase" value={p.id} />
				<button class="linkish" onclick={(e) => !confirm('Return this purchase and take back its Crumbs?') && e.preventDefault()}>Return</button>
			{/if}
		</form>
	{/each}
</section>

<a href="/staff">&larr; Next customer</a>

<style>
	.who {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 14px;
	}
	.who img {
		width: 64px;
	}
	.who h1 {
		margin: 0;
	}
	.who p {
		margin: 0;
	}
	.bal {
		margin-left: auto;
		text-align: right;
		display: flex;
		flex-direction: column;
		line-height: 1;
	}
	.bal b {
		font: 700 2.2rem var(--display);
		color: var(--maroon);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0 14px;
	}
	.ok {
		color: var(--olive);
		font-weight: 700;
	}
	.line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 8px 0;
		border-bottom: 1px dashed var(--line);
	}
	.line .btn {
		padding: 6px 16px;
	}
</style>
