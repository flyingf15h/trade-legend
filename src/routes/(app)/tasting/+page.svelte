<script lang="ts">
	import { enhance } from '$app/forms';
	import { ART } from '#lib/art.ts';
	import { EARN } from '#lib/rewards.ts';
	import { monthName, shortDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let track: HTMLDivElement | undefined = $state();
	let index = $state(0);
	function onScroll() {
		if (!track) return;
		index = Math.round(track.scrollLeft / track.clientWidth);
	}
	function go(i: number) {
		track?.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
	}
</script>

<svelte:head><title>Vote · Crumb Club</title></svelte:head>

<h1 class="title">What should Grandma bake next?</h1>

{#if data.ballot}
	{@const b = data.ballot}
	<div class="center"><span class="pill butter reward">🍪 +{EARN.vote} Crumbs</span></div>

	{#if form?.voted}
		<p class="note center done">Your vote&rsquo;s in the mixing bowl! Here are {EARN.vote} Crumbs for helping.</p>
	{:else if b.votedFor !== null}
		<p class="small muted center">Thanks for voting! The winner goes on sale in {monthName(b.round.month)}.</p>
	{:else}
		<p class="small muted center">
			For {monthName(b.round.month)}. One vote each, open until {shortDate(b.round.closesOn)}. If it&rsquo;s a tie, Grandma picks.
		</p>
	{/if}
	{#if form?.error}<p class="error center" role="alert">{form.error}</p>{/if}

	<div class="carousel" bind:this={track} onscroll={onScroll}>
		{#each b.candidates as c (c.id)}
			{@const mine = b.votedFor === c.id}
			<article class="slide">
				<div class="vote-card" class:mine>
					<div class="pic">
						<img src={ART.food[c.art]} alt="" />
						{#if mine}<img src={ART.spoon} alt="" class="spoon" />{/if}
					</div>
					<h2>{c.name}</h2>
					<p class="dish hand">{c.dish}</p>
					<p class="small desc">{c.description}</p>
					<p class="small"><b>Allergens:</b> {c.allergens}</p>
					{#if b.votedFor === null}
						<form method="POST" action="?/vote" use:enhance>
							<input type="hidden" name="candidate" value={c.id} />
							<button class="btn block">Vote</button>
						</form>
					{:else}
						<p class="voted" class:mine>{mine ? '🥄 Your vote' : ' '}</p>
					{/if}
				</div>
			</article>
		{/each}
	</div>
	<div class="dots" aria-hidden="true">
		{#each b.candidates as c, i (c.id)}
			<button class:on={i === index} onclick={() => go(i)} tabindex="-1" aria-label="Show flavour {i + 1}"></button>
		{/each}
	</div>
{:else}
	<p class="hand center lead">The ballot is resting. New recipe cards go up on the 1st of every month.</p>
{/if}

<section class="archive">
	<h2>Grandma&rsquo;s Recipe Archive</h2>
	<p class="small muted">Every flavour the neighbourhood picked.</p>
	<div class="arch-grid">
		{#each data.archive as a (a.round)}
			<div class="arch panel">
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
	.title {
		text-align: center;
		font-size: 2.3rem;
		margin: 8px 0 12px;
	}
	.reward {
		font: 400 1.1rem var(--display);
		padding: 6px 16px;
		margin-bottom: 10px;
	}
	.lead {
		font-size: 1.4rem;
	}
	.done {
		margin: 4px 0 12px;
	}
	.carousel {
		display: flex;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		margin: 8px -18px 0;
		-webkit-overflow-scrolling: touch;
	}
	.carousel::-webkit-scrollbar {
		display: none;
	}
	.slide {
		flex: 0 0 100%;
		scroll-snap-align: center;
		padding: 6px 18px 10px;
	}
	.vote-card {
		background: var(--paper);
		border: 1.5px solid var(--line);
		border-radius: 30px;
		padding: 18px;
		box-shadow: var(--soft-shadow);
		text-align: center;
	}
	.vote-card.mine {
		border: 2px solid var(--ink);
		box-shadow: var(--shadow);
	}
	.pic {
		position: relative;
		height: 200px;
		border-radius: 22px;
		background: #fff4f4;
		border: 1.5px solid #f6dede;
		display: grid;
		place-items: center;
		margin-bottom: 14px;
	}
	.pic img {
		max-height: 140px;
	}
	.spoon {
		position: absolute;
		right: -10px;
		bottom: 8px;
		width: 120px;
		transform: rotate(-18deg);
	}
	.vote-card h2 {
		font-size: 2rem;
		margin: 0;
	}
	.dish {
		color: var(--muted);
		font-size: 1.3rem;
		margin: 0 0 6px;
	}
	.desc {
		margin-bottom: 4px;
	}
	.vote-card .btn {
		margin-top: 12px;
		border-radius: 18px;
	}
	.voted {
		margin: 12px 0 0;
		min-height: 1.5em;
		font: 400 1.3rem var(--display);
		color: var(--maroon);
	}
	.dots {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin: 10px 0 0;
	}
	.dots button {
		width: 12px;
		height: 12px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: #e6d9d6;
		cursor: pointer;
	}
	.dots button.on {
		background: var(--maroon);
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
