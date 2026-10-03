<script lang="ts">
	import { enhance } from '$app/forms';
	import { ART } from '#lib/art.ts';
	import { monthName, shortDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const arts = Object.keys(ART.food);
</script>

<svelte:head><title>Kitchen tasks · Counter</title></svelte:head>

<h1>Kitchen tasks</h1>
{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}

{#each data.ties as t (t.id)}
	<section class="card tie">
		<h2>It&rsquo;s a tie for {monthName(t.month)}! Grandma picks.</h2>
		<form method="POST" action="?/pickWinner" use:enhance>
			<input type="hidden" name="round" value={t.id} />
			{#each t.tally as c (c.candidateId)}
				<button class="btn soft" name="candidate" value={c.candidateId}>{c.name} ({c.votes})</button>
			{/each}
		</form>
	</section>
{/each}

<section class="card">
	<h2>Reviews to check <span class="pill">{data.reviews.length}</span></h2>
	<p class="small muted">Open the link, make sure the review is real, then approve for 250 Crumbs.</p>
	{#each data.reviews as r (r.id)}
		<form method="POST" use:enhance class="line">
			<span><b>{r.name}</b> · <a href={r.link} target="_blank" rel="noopener noreferrer">open review</a> <small class="muted">{shortDate(r.createdAt)}</small></span>
			<input type="hidden" name="id" value={r.id} />
			<span>
				<button class="btn" formaction="?/approveReview">Approve</button>
				<button class="linkish" formaction="?/rejectReview">Can&rsquo;t find it</button>
			</span>
		</form>
	{:else}
		<p class="muted">All caught up.</p>
	{/each}
</section>

<section class="card">
	<h2>Notes for the fridge <span class="pill">{data.notes.length}</span></h2>
	{#each data.notes as n (n.id)}
		<form method="POST" action="?/note" use:enhance class="line">
			<span class="hand">&ldquo;{n.text}&rdquo; <small class="muted">&mdash; {n.name}</small></span>
			<input type="hidden" name="id" value={n.id} />
			<span>
				<button class="btn soft" name="status" value="approved">Pin up</button>
				<button class="linkish" name="status" value="hidden">Hide</button>
			</span>
		</form>
	{:else}
		<p class="muted">No new notes.</p>
	{/each}
</section>

{#if data.latest}
	<section class="card">
		<h2>Votes for {monthName(data.latest.month)}</h2>
		<p class="small muted">Voting {shortDate(data.latest.opensOn)} to {shortDate(data.latest.closesOn)}</p>
		{#each data.latest.tally as c (c.candidateId)}
			<div class="line"><span>{c.name}</span><b>{c.votes}</b></div>
		{/each}
	</section>
{/if}

<section class="card">
	<h2>Set up the {monthName(data.nextBallotMonth)} ballot</h2>
	{#if form?.created}<p class="ok">Ballot for {monthName(form.created)} is ready. Voting opens on the 1st of the month before.</p>{/if}
	<form method="POST" action="?/newRound" use:enhance>
		<input type="hidden" name="month" value={data.nextBallotMonth} />
		{#each [0, 1, 2] as i (i)}
			<fieldset>
				<legend>Flavour {i + 1}</legend>
				<div class="grid">
					<input name="name{i}" placeholder="Fun name, e.g. Strawberry Sunday" />
					<input name="dish{i}" placeholder="What it is, e.g. Strawberry shortcake parfait" />
				</div>
				<textarea name="desc{i}" rows="2" placeholder="A line or two to make people hungry"></textarea>
				<div class="grid">
					<input name="ing{i}" placeholder="Main ingredients" />
					<input name="all{i}" placeholder="Allergens, e.g. Wheat, egg, milk" />
				</div>
				<label class="small">Picture
					<select name="art{i}">{#each arts as a (a)}<option>{a}</option>{/each}</select>
				</label>
			</fieldset>
		{/each}
		<button class="btn">Save ballot</button>
	</form>
</section>

<style>
	.line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 8px 0;
		border-bottom: 1px dashed var(--line);
		flex-wrap: wrap;
	}
	.line .btn {
		padding: 6px 16px;
	}
	.tie {
		border: 2px solid var(--red);
	}
	.tie form {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.ok {
		color: var(--olive);
		font-weight: 700;
	}
	fieldset {
		border: 1px dashed var(--line);
		border-radius: 12px;
		margin: 0 0 12px;
		padding: 10px 12px;
	}
	legend {
		font-weight: 700;
		color: var(--maroon);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 8px;
		margin-bottom: 8px;
	}
	textarea {
		margin-bottom: 8px;
	}
	select {
		width: auto;
		margin-left: 6px;
	}
</style>
