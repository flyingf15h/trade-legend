<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { ART } from '#lib/art.ts';
	import { EARN, ICONS } from '#lib/rewards.ts';
	import { prettyPhone, shortDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let icon = $state(untrack(() => data.member.icon));
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	let bday = $derived(data.profile.birthday?.split('-').map(Number) ?? null);
</script>

<svelte:head><title>Birthday &amp; details · Crumb Club</title></svelte:head>

<p class="muted small since">Member since {shortDate(data.profile.since)} · {prettyPhone(data.profile.phone)}</p>

<form method="POST" action="?/profile" use:enhance class="card">
	<h2>About you</h2>
	<label class="field"><span>Name</span><input name="name" value={data.profile.name} required /></label>
	<label class="field"
		><span>Email <small>optional</small></span><input name="email" type="email" value={data.profile.email ?? ''} /></label
	>
	<fieldset class="icons">
		<legend>Your little friend</legend>
		{#each ICONS as i (i.key)}
			<label class:on={icon === i.key}>
				<input type="radio" name="icon" value={i.key} bind:group={icon} class="sr-only" />
				<img src={ART.avatar[i.key]} alt={i.label} />
			</label>
		{/each}
	</fieldset>

	<div id="birthday" class="field">
		<span class="lbl">Birthday <small>for a free pastry during your birthday week</small></span>
		{#if bday}
			<p class="bday">
				<img src={ART.food.cake} alt="" />
				{months[bday[0] - 1]} {bday[1]} <small class="muted">(ask at the counter if this needs fixing)</small>
			</p>
		{:else}
			<div class="row">
				<select name="bmonth" aria-label="Birthday month">
					<option value="">Month</option>
					{#each months as m, i (m)}<option value={i + 1}>{m}</option>{/each}
				</select>
				<input name="bday" type="number" min="1" max="31" placeholder="Day" aria-label="Birthday day" />
			</div>
		{/if}
	</div>

	<label class="check">
		<input type="checkbox" name="marketing" checked={data.profile.marketing} />
		<span>Send me the odd note about new bakes and specials.</span>
	</label>
	{#if form?.profileError}<p class="error">{form.profileError}</p>{/if}
	{#if form?.saved}<p class="saved">Saved! Grandma&rsquo;s written it down.</p>{/if}
	<button class="btn block">Save</button>
</form>

<section id="review" class="card review">
	<h2>Say something nice? <span class="pill butter">+{EARN.review} Crumbs</span></h2>
	{#if data.review?.status === 'approved'}
		<p>Thank you for your review, dear. It made Grandma&rsquo;s day.</p>
	{:else if data.review?.status === 'pending' || form?.reviewed}
		<p>Got it! Staff will check your review and add the Crumbs soon.</p>
	{:else}
		<p class="small">Post a review of Grandma&rsquo;s on Google or Yelp, then paste the link here. Staff check it before the Crumbs go in.</p>
		<form method="POST" action="?/review" use:enhance>
			<input name="link" type="url" placeholder="https://g.co/kgs/…" required />
			{#if data.review?.status === 'rejected'}<p class="small error">We couldn&rsquo;t find your last link. Try again?</p>{/if}
			{#if form?.reviewError}<p class="error">{form.reviewError}</p>{/if}
			<button class="btn soft block">Send it in</button>
		</form>
	{/if}
</section>


<style>
	.since {
		text-align: center;
	}
	.icons {
		border: 0;
		padding: 0;
		margin: 0 0 14px;
		display: flex;
		gap: 8px;
	}
	.icons legend {
		font-weight: 600;
		margin-bottom: 6px;
	}
	.icons label {
		border: 3px solid transparent;
		border-radius: 50%;
		cursor: pointer;
		line-height: 0;
	}
	.icons label.on {
		border-color: var(--maroon);
	}
	.icons label:has(input:focus-visible) {
		outline: 3px solid var(--butter);
	}
	.icons img {
		width: 54px;
	}
	.lbl {
		display: block;
		font-weight: 600;
		margin-bottom: 4px;
	}
	.lbl small {
		font-weight: 400;
		color: var(--muted);
	}
	.field {
		margin-bottom: 14px;
	}
	.bday {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0;
	}
	.bday img {
		width: 36px;
	}
	.check {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		margin-bottom: 14px;
	}
	.check input {
		margin-top: 4px;
		width: 18px;
		height: 18px;
		accent-color: var(--maroon);
		flex: none;
	}
	.saved {
		color: var(--olive);
		font-weight: 600;
	}
	.review {
		margin-top: 16px;
	}
	.review h2 {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.review input {
		margin-bottom: 10px;
	}
</style>
