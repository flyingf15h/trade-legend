<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<header class="bar">
	<div class="inner">
		<a href="/staff" class="brand">Crumb Club <span>counter</span></a>
		{#if data.staff}
			<nav>
				<a href="/staff" class:on={page.url.pathname === '/staff'}>Counter</a>
				<a href="/staff/queue" class:on={page.url.pathname === '/staff/queue'}>Kitchen tasks</a>
				<form method="POST" action="/staff?/logout"><button class="linkish">Lock</button></form>
			</nav>
		{/if}
	</div>
</header>
<main>{@render children()}</main>

<style>
	.bar {
		background: var(--maroon-dk);
		color: var(--paper);
		padding: 12px 16px;
	}
	.inner {
		max-width: 760px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}
	.brand {
		font: 600 1.2rem var(--display);
		color: var(--paper);
		text-decoration: none;
	}
	.brand span {
		font-family: var(--hand);
		font-size: 1.3rem;
		color: var(--butter);
	}
	nav {
		margin-left: auto;
		display: flex;
		gap: 14px;
		align-items: center;
	}
	nav a,
	nav .linkish {
		color: var(--paper);
		opacity: 0.8;
	}
	nav a.on {
		opacity: 1;
		font-weight: 700;
	}
	main {
		max-width: 760px;
		margin: 0 auto;
		padding: 20px 16px 60px;
	}
	main :global(.card) {
		margin-bottom: 16px;
	}
</style>
