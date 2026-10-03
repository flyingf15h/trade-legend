<script lang="ts">
	import { enhance } from '$app/forms';
	import { ART } from '#lib/art.ts';
	import { EARN } from '#lib/rewards.ts';
	import { monthName, shortDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let choice = $state<number | null>(null);
	const tilts = [-1.5, 1, -0.6];
</script>

<svelte:head><title>The Tasting Table · Crumb Club</title></svelte:head>

<h1>The Tasting Table</h1>

{#if data.ballot}
	{@const b = data.ballot}
	<p class="lead">Help Grandma decide what&rsquo;s coming out of the oven in <b>{monthName(b.round.month)}</b>!</p>

	{#if form?.voted}
		<p class="note done">Your vote&rsquo;s in the mixing bowl! Here are {EARN.vote} Crumbs for helping.</p>
	{:else if b.votedFor === null}
		<p class="small muted">
			One vote per member, worth <b>{EARN.vote} Crumbs</b>. Voting closes {shortDate(b.round.closesOn)}. If there&rsquo;s a tie, Grandma
			picks the winner.
		</p>
	{:else}
		<p class="small muted">Thanks for voting! We&rsquo;ll announce the winner after {shortDate(b.round.closesOn)}.</p>
	{/if}

	<form method="POST" action="?/vote" use:enhance class="ballot">
		{#each b.candidates as c, i (c.id)}
			{@const mine = b.votedFor === c.id}
			<label class="recipe-card cand" class:mine class:picked={choice === c.id} style="--tilt:{tilts[i % 3]}deg">
				{#if b.votedFor === null}
					<input type="radio" name="candidate" value={c.id} bind:group={choice} class="sr-only" />
				{/if}
				{#if mine}<img src={ART.spoon} alt="Your vote" class="spoon" />{/if}
				<div class="cand-top">
					<img src={ART.food[c.art]} alt="" class="cand-art" />
					<div>
						<h2>{c.name}</h2>
						<p class="dish">{c.dish}</p>
					</div>
				</div>
				<p>{c.description}</p>
				<p class="small"><b>In it:</b> {c.ingredients}</p>
				<p class="small allergens"><b>Contains:</b> {c.allergens}</p>
			</label>
		{/each}
		{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
		{#if b.votedFor === null}
			<button class="btn block vote-btn" disabled={choice === null}>
				{choice === null ? 'Pick a recipe card' : `Vote for ${b.candidates.find((c) => c.id === choice)?.name}`}
			</button>
		{/if}
	</form>
{:else}
	<p class="lead">The ballot is resting. Grandma lays out new recipe cards on the 1st of every month.</p>
{/if}

<section class="archive">
	<h2>Grandma&rsquo;s Recipe Archive</h2>
	<p class="small muted">Every flavour the neighbourhood picked.</p>
	<div class="arch-grid">
		{#each data.archive as a (a.round)}
			<div class="arch card">
				<span class="rosette" title="Neighbourhood Favourite">★</span>
				<img src={ART.food[a.c.art]} alt="" />
				<b>{a.c.name}</b>
				<span class="small muted">{monthName(a.month)} · {a.c.dish}</span>
			</div>
		{/each}
	</div>
</section>

<section class="fridge">
	<h2>Leave a note on the fridge</h2>
	<p class="small muted">Got a flavour idea? Grandma reads every note before it goes up.</p>
	{#if data.fridge.length}
		<div class="magnets">
			{#each data.fridge as n, i (n.id)}
				<p class="fnote" style="--tilt:{(i % 3) - 1}deg">{n.text} <span>&mdash; {n.name}</span></p>
			{/each}
		</div>
	{/if}
	{#if form?.noted}
		<p class="note">Thank you, dear! I&rsquo;ll pin it up once I&rsquo;ve had a read.</p>
	{:else}
		<form method="POST" action="?/note" use:enhance class="note-form">
			<textarea name="text" rows="2" maxlength="200" placeholder="Maple bacon donut, please!"></textarea>
			{#if form?.noteError}<p class="error">{form.noteError}</p>{/if}
			<button class="btn soft">Pin it up</button>
		</form>
		{#if data.myPending}<p class="small muted">{data.myPending} of your notes {data.myPending === 1 ? 'is' : 'are'} waiting for Grandma.</p>{/if}
	{/if}
</section>

<style>
	.lead {
		font-family: var(--hand);
		font-size: 1.45rem;
		line-height: 1.15;
		margin-bottom: 8px;
	}
	.done {
		margin: 10px 0 18px;
	}
	.ballot {
		margin-top: 14px;
	}
	.cand {
		position: relative;
		display: block;
		margin-bottom: 16px;
		cursor: pointer;
		transform: rotate(var(--tilt));
		transition: transform 0.15s, box-shadow 0.15s;
		line-height: 28px;
	}
	.cand p {
		margin: 0;
	}
	.cand.picked,
	.cand.mine {
		transform: rotate(0) scale(1.015);
		box-shadow: 0 0 0 3px var(--maroon), var(--shadow);
	}
	.cand:has(input:focus-visible) {
		outline: 3px solid var(--butter);
	}
	.cand-top {
		display: flex;
		gap: 12px;
		align-items: center;
	}
	.cand-art {
		width: 70px;
		height: 70px;
		flex: none;
	}
	.cand h2 {
		margin: 0;
	}
	.dish {
		font-family: var(--hand);
		font-size: 1.3rem;
		color: var(--muted);
	}
	.allergens {
		color: var(--red);
	}
	.spoon {
		position: absolute;
		top: -14px;
		right: -6px;
		width: 110px;
		transform: rotate(-20deg);
		filter: drop-shadow(0 3px 3px rgba(0, 0, 0, 0.15));
	}
	.vote-btn {
		position: sticky;
		bottom: calc(var(--nav-h) + 12px);
	}
	.archive {
		margin-top: 30px;
	}
	.arch-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}
	.arch {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 14px 10px;
	}
	.arch img {
		height: 58px;
	}
	.arch b {
		font-family: var(--display);
		color: var(--maroon);
	}
	.rosette {
		position: absolute;
		top: -8px;
		right: -6px;
		width: 30px;
		height: 30px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--red);
		color: var(--butter);
		border: 3px double var(--paper);
	}
	.fridge {
		margin-top: 30px;
		padding: 18px;
		border-radius: 18px;
		background: #e7eef0;
		border: 1px solid #cfdadf;
	}
	.magnets {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
		margin-bottom: 14px;
	}
	.fnote {
		font-family: var(--hand);
		font-size: 1.15rem;
		line-height: 1.1;
		background: #fff;
		padding: 10px;
		margin: 0;
		transform: rotate(var(--tilt));
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
		position: relative;
	}
	.fnote::before {
		content: '';
		position: absolute;
		top: -6px;
		left: 50%;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--red);
		box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.2);
	}
	.fnote span {
		display: block;
		color: var(--muted);
		font-size: 0.95rem;
	}
	.note-form textarea {
		font-family: var(--hand);
		font-size: 1.25rem;
		margin-bottom: 8px;
	}
</style>
