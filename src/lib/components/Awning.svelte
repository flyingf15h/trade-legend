<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children, small = false }: { children?: Snippet; small?: boolean } = $props();
</script>

<header class="awning" class:small>
	<div class="stripes" aria-hidden="true"></div>
	<div class="inner">
		{#if children}{@render children()}{:else}
			<div class="brand">
				<span class="title">The Crumb Club</span>
				<span class="sub">at Grandma&rsquo;s Bakery</span>
			</div>
		{/if}
	</div>
</header>

<style>
	.awning {
		position: relative;
		z-index: 3;
		background: var(--maroon);
		color: var(--paper);
		padding: 14px 18px 12px;
		margin-bottom: 24px;
	}
	.stripes {
		position: absolute;
		inset: 0 0 auto 0;
		height: 6px;
		background: repeating-linear-gradient(90deg, var(--maroon) 0 22px, #f7eddd 22px 44px);
		opacity: 0.9;
	}
	.awning::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -16px;
		height: 16px;
		background: radial-gradient(circle at 20px 0, var(--maroon) 19px, transparent 20px) 0 0 / 40px 16px repeat-x;
	}
	.inner {
		max-width: 560px;
		margin: 0 auto;
		padding-top: 4px;
	}
	.brand {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	.title {
		font: 600 1.6rem/1.1 var(--display);
		letter-spacing: -0.01em;
	}
	.sub {
		font-family: var(--hand);
		font-size: 1.25rem;
		opacity: 0.85;
	}
	.small .title {
		font-size: 1.25rem;
	}
</style>
