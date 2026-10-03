<script lang="ts">
	import Awning from '#lib/components/Awning.svelte';
	import { prettyPhone } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Check your phone</title></svelte:head>

<Awning />

<main>
	<h1>Check your phone</h1>
	<p>We sent a 6-digit code to <b>{prettyPhone(data.phone)}</b>.</p>

	{#if data.demoCode}
		<div class="note demo">
			Demo mode: your code is <b>{data.demoCode}</b>
		</div>
	{/if}

	<form method="POST" action="?/verify" class="card">
		<label class="field">
			<span>Code</span>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				name="code"
				inputmode="numeric"
				autocomplete="one-time-code"
				maxlength="6"
				pattern="[0-9]*"
				class="code"
				required
				autofocus
			/>
		</label>
		{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
		{#if form && 'resent' in form}<p class="muted">A fresh code is on its way.</p>{/if}
		<button class="btn block">That&rsquo;s me</button>
	</form>

	<form method="POST" action="?/resend" class="again">
		<button class="linkish">Send a new code</button> · <a href="/join">Use a different number</a>
	</form>
</main>

<style>
	main {
		max-width: var(--col);
		margin: 0 auto;
		padding: 8px 16px 48px;
		text-align: center;
	}
	.demo {
		display: inline-block;
		margin: 6px 0 22px;
	}
	.card {
		text-align: left;
	}
	.code {
		font: 600 1.8rem var(--display);
		letter-spacing: 0.4em;
		text-align: center;
	}
	.again {
		margin-top: 16px;
	}
</style>
