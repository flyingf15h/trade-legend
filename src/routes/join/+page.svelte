<script lang="ts">
	import { untrack } from 'svelte';
	import Awning from '#lib/components/Awning.svelte';
	import { ART } from '#lib/art.ts';
	import { EARN, ICONS } from '#lib/rewards.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	// forms here post without enhance, so the page reloads and these only need their first value
	let mode = $state<'join' | 'back'>(untrack(() => (form?.back || data.mode === 'back' ? 'back' : 'join')));
	let icon = $state(untrack(() => (form && 'icon' in form && form.icon ? form.icon : 'croissant')));
</script>

<svelte:head><title>Join the Crumb Club</title></svelte:head>

<Awning />

<main>
	<div class="treats" aria-hidden="true">
		<img src={ART.food.croissant} alt="" style="--r:-12deg" />
		<img src={ART.food.pudding} alt="" style="--r:6deg" />
		<img src={ART.food.puff} alt="" style="--r:-4deg" />
		<img src={ART.food.muffin} alt="" style="--r:10deg" />
	</div>

	{#if mode === 'join'}
		<section class="intro">
			<h1>A little treat for stopping by.</h1>
			{#if data.referrer}
				<p class="note">{data.referrer} saved you a seat at the table!</p>
			{/if}
			<p>
				Earn <strong>Crumbs</strong> <span class="muted">(our loyalty points)</span> every time you shop, help pick the
				flavour of the month, and take a daily turn at Grandma&rsquo;s Lucky Cupboard.
			</p>
			<ul class="perks">
				<li><b>5</b> Crumbs for every $1</li>
				<li><b>{EARN.vote}</b> for voting on new flavours</li>
				<li>Free treats from <b>100</b> Crumbs</li>
				<li>A pastry on your birthday week</li>
			</ul>
		</section>

		<form method="POST" action="?/join" class="card">
			<label class="field">
				<span>Your first name</span>
				<input name="name" autocomplete="given-name" required value={form && 'name' in form ? form.name : ''} />
			</label>
			<label class="field">
				<span>Phone number <small>we&rsquo;ll text a code to check it&rsquo;s you</small></span>
				<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="519 555 0123" required value={form?.phone ?? ''} />
			</label>
			<label class="field">
				<span>Email <small>optional, for receipts</small></span>
				<input name="email" type="email" autocomplete="email" value={form && 'email' in form ? form.email : ''} />
			</label>

			<fieldset class="icons">
				<legend>Pick a little friend for your card</legend>
				{#each ICONS as i (i.key)}
					<label class:on={icon === i.key}>
						<input type="radio" name="icon" value={i.key} bind:group={icon} class="sr-only" />
						<img src={ART.avatar[i.key]} alt="" />
						<span>{i.label}</span>
					</label>
				{/each}
			</fieldset>

			<label class="check">
				<input type="checkbox" name="marketing" checked={form && 'marketing' in form ? !!form.marketing : false} />
				<span>Send me the odd note about new bakes and specials. <small class="muted">Totally optional, and separate from joining.</small></span>
			</label>

			{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
			<button class="btn block">Save me a seat</button>
		</form>

		<p class="switch">Already in the club? <button class="linkish" onclick={() => (mode = 'back')}>Welcome back</button></p>
	{:else}
		<section class="intro">
			<h1>Welcome back, dear.</h1>
			<p>Pop in your phone number and we&rsquo;ll send you a code.</p>
		</section>
		<form method="POST" action="?/back" class="card">
			<label class="field">
				<span>Phone number</span>
				<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="519 555 0123" required value={form?.phone ?? ''} />
			</label>
			{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
			<button class="btn block">Send my code</button>
		</form>
		<p class="switch">New here? <button class="linkish" onclick={() => (mode = 'join')}>Join the Crumb Club</button></p>
		<p class="switch small muted">Trying the demo? Use <b>519 555 0123</b> to visit as Sophie.</p>
	{/if}
</main>

<style>
	main {
		max-width: 520px;
		margin: 0 auto;
		padding: 0 16px 48px;
	}
	.treats {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin: 6px 0 4px;
	}
	.treats img {
		height: 56px;
		transform: rotate(var(--r));
	}
	.intro {
		text-align: center;
		margin-bottom: 18px;
	}
	.intro .note {
		display: inline-block;
		margin: 6px 0 14px;
	}
	.perks {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		font-size: 0.92rem;
	}
	.perks li {
		background: var(--paper);
		border: 1px dashed var(--line);
		border-radius: 12px;
		padding: 8px 10px;
	}
	.perks b {
		font-family: var(--display);
		color: var(--maroon);
	}
	.icons {
		border: 0;
		padding: 0;
		margin: 4px 0 16px;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}
	.icons legend {
		font-weight: 600;
		margin-bottom: 8px;
	}
	.icons label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		text-align: center;
		font-size: 0.72rem;
		line-height: 1.2;
		padding: 8px 4px;
		border: 2px solid transparent;
		border-radius: 14px;
		cursor: pointer;
	}
	.icons label.on {
		border-color: var(--maroon);
		background: var(--cream);
	}
	.icons label:has(input:focus-visible) {
		outline: 3px solid rgba(242, 201, 76, 0.7);
	}
	.icons img {
		width: 56px;
		height: 56px;
	}
	.check {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		margin-bottom: 16px;
		font-size: 0.92rem;
	}
	.check input {
		margin-top: 4px;
		accent-color: var(--maroon);
		width: 18px;
		height: 18px;
		flex: none;
	}
	.switch {
		text-align: center;
		margin-top: 16px;
	}
</style>
