<script lang="ts">
	import Scanner from './Scanner.svelte';
	import { prettyPhone, shortDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let lookupForm: HTMLFormElement | undefined = $state();
	let q = $state('');

	function scanned(text: string) {
		q = text;
		queueMicrotask(() => lookupForm?.requestSubmit());
	}
</script>

<svelte:head><title>Counter · Crumb Club</title></svelte:head>

{#if !data.staff}
	<form method="POST" action="?/login" class="card pin">
		<h1>Staff counter</h1>
		<label class="field"><span>PIN</span><input name="pin" type="password" inputmode="numeric" autocomplete="off" required /></label>
		{#if form?.error}<p class="error">{form.error}</p>{/if}
		<button class="btn block">Unlock</button>
	</form>
{:else if data.voucher}
	{@const v = data.voucher}
	{@const expired = v.expiresAt < new Date().toISOString()}
	<section class="card">
		<p class="muted small">Voucher {v.code}</p>
		<h1>{v.title}</h1>
		<p>For <a href="/staff/m/{v.memberId}">{v.name}</a>. {v.terms}</p>
		{#if form?.used}
			<p class="ok">Done! {form.used} marked as used.</p>
		{:else if v.status !== 'ready'}
			<p class="error">Already {v.status}{v.usedAt ? ` on ${shortDate(v.usedAt)}` : ''}.</p>
		{:else if expired}
			<p class="error">Expired {shortDate(v.expiresAt)}.</p>
		{:else}
			<p class="small muted">Good until {shortDate(v.expiresAt)}. Ring up the sale first, then mark it used.</p>
			<form method="POST" action="?/use">
				<input type="hidden" name="code" value={v.code} />
				{#if form?.error}<p class="error">{form.error}</p>{/if}
				<button class="btn block">Mark as used</button>
			</form>
		{/if}
	</section>
	<a href="/staff">&larr; Back to the counter</a>
{:else}
	<h1>Who&rsquo;s at the counter?</h1>
	<p class="muted">Scan their membership card or a treat voucher, or type a phone number.</p>
	<Scanner onscan={scanned} />
	<form method="POST" action="?/lookup" class="card lookup" bind:this={lookupForm}>
		<input name="q" bind:value={q} placeholder="CRUMB-…, TREAT-…, phone or name" autocomplete="off" />
		<button class="btn">Find</button>
	</form>
	{#if form?.error}<p class="error">{form.error}</p>{/if}
	{#if form && 'matches' in form && form.matches}
		<ul class="matches card">
			{#each form.matches as m (m.id)}
				<li><a href="/staff/m/{m.id}">{m.name}</a> <span class="muted">{prettyPhone(m.phone)}</span></li>
			{/each}
		</ul>
	{/if}
{/if}

<style>
	.pin {
		max-width: 360px;
		margin: 40px auto;
	}
	.lookup {
		display: flex;
		gap: 10px;
	}
	.ok {
		color: var(--olive);
		font-weight: 700;
		font-size: 1.1rem;
	}
	.matches {
		list-style: none;
		padding: 12px 18px;
	}
	.matches li {
		padding: 6px 0;
	}
</style>
