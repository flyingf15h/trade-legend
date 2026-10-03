<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import ClawMachine, { type Capsule } from '#lib/components/ClawMachine.svelte';
	import CapsuleReveal from '#lib/components/CapsuleReveal.svelte';
	import { ART } from '#lib/art.ts';
	import { PLAY_COST, REWARDS, type Prize } from '#lib/rewards.ts';
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
	let machine: ReturnType<typeof ClawMachine> | undefined = $state();

	let canPlay = $derived(data.freePlay || data.balance >= PLAY_COST);
	let label = $derived(data.freePlay ? 'Play Free' : `Play · ${PLAY_COST} Crumbs`);

	async function start(): Promise<Capsule | string> {
		const res = await fetch('/cupboard/play', { method: 'POST' });
		const body = await res.json().catch(() => ({ error: 'Something went wrong. Try again?' }));
		if (!res.ok) return body.error ?? body.message ?? 'Something went wrong. Try again?';
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

	const describe = (key: string) => {
		if (key.startsWith('crumbs')) return `${key.slice(6)} Crumbs`;
		if (key === 'double') return 'Double Crumbs';
		return REWARDS[key]?.title ?? key;
	};
	const capOf = (json: string) => JSON.parse(json) as Capsule;
</script>

<svelte:head><title>Grandma&rsquo;s Lucky Cupboard · Crumb Club</title></svelte:head>

<h1 class="title">Grandma&rsquo;s Lucky Cupboard</h1>

<ClawMachine bind:this={machine} {canPlay} {label} turn={data.turns} {start} {ondone} />

<p class="caption">
	{#if data.freePlay}1 free pull today<br /><span>Then {PLAY_COST} Crumbs</span>{:else}Today&rsquo;s free pull is used<br /><span>{PLAY_COST} Crumbs a pull, free again tomorrow</span>{/if}
</p>

{#if data.recent.length}
	<section class="recent">
		<h2>Your recent capsules</h2>
		<ul>
			{#each data.recent as r (r.id)}
				{@const cap = capOf(r.capsule)}
				<li>
					<img src={cap.type === 'special' ? ART.capsuleSpecial[cap.shape] : (ART.capsule[cap.colour] ?? ART.capsule.pink)} alt="" />
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
	.caption {
		text-align: center;
		font-weight: 700;
		margin: 10px 0 0;
	}
	.caption span {
		font-weight: 400;
		color: var(--muted);
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
