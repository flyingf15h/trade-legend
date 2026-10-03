<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import ClawMachine, { type Capsule } from '#lib/components/ClawMachine.svelte';
	import CapsuleReveal from '#lib/components/CapsuleReveal.svelte';
	import { ART } from '#lib/art.ts';
	import { PLAY_COST, REWARDS, ROUND_PRIZES, SPECIAL_ODDS, SPECIAL_SHAPES, type Prize } from '#lib/rewards.ts';
	import { shortDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Result = {
		free: boolean;
		capsule: Capsule;
		prize: Prize;
		label: string;
		voucher: { code: string; expiresAt: string } | null;
		balance: number;
	};
	let pending = $state<Result | null>(null);
	let showing = $state<Result | null>(null);
	let problem = $state<string | null>(null);
	let machine: ReturnType<typeof ClawMachine> | undefined = $state();

	let canPlay = $derived(data.freePlay || data.balance >= PLAY_COST);
	let label = $derived(data.freePlay ? 'Free daily play' : `Play for ${PLAY_COST} Crumbs`);

	async function start(): Promise<Capsule | null> {
		problem = null;
		const res = await fetch('/cupboard/play', { method: 'POST' });
		const body = await res.json().catch(() => ({ error: 'Something went wrong. Try again?' }));
		if (!res.ok) {
			problem = body.error ?? body.message ?? 'Something went wrong. Try again?';
			return null;
		}
		pending = body as Result;
		invalidateAll();
		return pending.capsule;
	}

	function ondone() {
		showing = pending;
		pending = null;
	}

	async function again() {
		showing = null;
		await invalidateAll();
		machine?.begin();
	}

	const total = ROUND_PRIZES.reduce((s, p) => s + p.weight, 0);
	const pct = (w: number) => {
		const v = ((w / total) * (1 - SPECIAL_ODDS) * 100);
		return v < 1 ? v.toFixed(1) : Math.round(v).toString();
	};
	const describe = (key: string) => {
		if (key.startsWith('crumbs')) return `${key.slice(6)} Crumbs`;
		if (key === 'double') return 'Double Crumbs';
		return REWARDS[key]?.title ?? key;
	};
	const capOf = (json: string) => JSON.parse(json) as Capsule;
</script>

<svelte:head><title>Grandma&rsquo;s Lucky Cupboard · Crumb Club</title></svelte:head>

<h1 class="title">Grandma&rsquo;s Lucky Cupboard</h1>
<p class="lead">
	Every turn wins a capsule!
	{#if data.freePlay}<span class="pill mint">Free play ready</span>{:else}<span class="pill">{PLAY_COST} Crumbs a turn</span>{/if}
</p>

<ClawMachine bind:this={machine} {canPlay} {label} turn={data.turns} {start} {ondone} />

{#if problem}<p class="error center" role="alert">{problem}</p>{/if}
{#if !canPlay}
	<p class="center muted">You need {PLAY_COST} Crumbs for another turn. Come back tomorrow for a free one!</p>
{/if}

<details class="card odds">
	<summary>What&rsquo;s in the cupboard?</summary>
	<p class="small">
		Hold the button to slide the claw, let go to drop it. Where it lands is just for fun: it always comes back with a capsule, and what&rsquo;s inside is decided fairly
		at random:
	</p>
	<table>
		<tbody>
			<tr class="special">
				<td>
					<span class="shapes">
						{#each SPECIAL_SHAPES as s (s)}<img src={ART.capsuleSpecial[s]} alt="" />{/each}
					</span>
					Treat-shaped capsule: free {SPECIAL_SHAPES.join(', ')}
				</td>
				<td>{Math.round(SPECIAL_ODDS * 100)}%</td>
			</tr>
			{#each ROUND_PRIZES as p (p.label)}
				<tr><td>{p.label}</td><td>{pct(p.weight)}%</td></tr>
			{/each}
		</tbody>
	</table>
</details>

{#if data.recent.length}
	<section class="recent">
		<h2>Your recent capsules</h2>
		<ul>
			{#each data.recent as r (r.id)}
				{@const cap = capOf(r.capsule)}
				<li>
					<img src={cap.type === 'special' ? ART.capsuleSpecial[cap.shape] : ART.capsuleTop[cap.colour]} alt="" />
					<span>{describe(r.prizeKey)}</span>
					<small>{shortDate(r.createdAt)}</small>
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if showing}
	<CapsuleReveal
		capsule={showing.capsule}
		prize={showing.prize}
		label={showing.label}
		voucher={showing.voucher}
		balance={data.balance}
		onagain={again}
		onclose={() => (showing = null)}
	/>
{/if}

<style>
	.title {
		text-align: center;
		font-size: 2.1rem;
		color: var(--maroon);
		margin: 4px 0 2px;
	}
	.lead {
		text-align: center;
		font-family: var(--hand);
		font-size: 1.3rem;
		margin-bottom: 0;
	}
	.lead .pill {
		vertical-align: 3px;
	}
	.center {
		text-align: center;
	}
	.odds {
		margin-top: 22px;
	}
	.odds summary {
		font: 600 1.05rem var(--display);
		color: var(--maroon);
		cursor: pointer;
	}
	.odds table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92rem;
	}
	.odds td {
		padding: 6px 0;
		border-bottom: 1px dashed var(--line);
	}
	.odds td:last-child {
		text-align: right;
		font-family: var(--display);
		color: var(--maroon);
		width: 60px;
	}
	.odds .special td {
		font-weight: 600;
	}
	.shapes {
		display: flex;
		gap: 2px;
		margin-bottom: 2px;
	}
	.shapes img {
		width: 26px;
	}
	.recent {
		margin-top: 22px;
	}
	.recent ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.recent li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 0;
		border-bottom: 1px dashed var(--line);
	}
	.recent img {
		width: 32px;
	}
	.recent span {
		flex: 1;
	}
	.recent small {
		color: var(--muted);
	}
</style>
