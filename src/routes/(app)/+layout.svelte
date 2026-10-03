<script lang="ts">
	import { page } from '$app/state';
	import { ART } from '#lib/art.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	type Tab = 'home' | 'treats' | 'lucky' | 'vote' | 'me';
	// title in the header, which tab is lit, and whether there's a back arrow to Me
	const PAGES: Record<string, { title: string; tab: Tab; back?: boolean }> = {
		'/kitchen': { title: '', tab: 'home' },
		'/treats': { title: 'Treat Shelf', tab: 'treats' },
		'/cupboard': { title: 'Lucky', tab: 'lucky' },
		'/tasting': { title: 'Vote', tab: 'vote' },
		'/me': { title: 'Me', tab: 'me' },
		'/recipe-book': { title: 'My Rewards', tab: 'me', back: true },
		'/invite': { title: 'Refer a Friend', tab: 'me', back: true },
		'/card': { title: 'My QR Code', tab: 'me', back: true },
		'/me/settings': { title: 'Birthday & details', tab: 'me', back: true },
		'/welcome': { title: 'Welcome', tab: 'home' }
	};
	let here = $derived(PAGES[page.url.pathname] ?? { title: '', tab: 'home' as Tab });
	let title = $derived(
		page.url.pathname === '/recipe-book' && page.url.searchParams.get('tab') === 'history' ? 'Crumb History' : here.title
	);

	const tabs: { key: Tab; href: string; label: string; icon: string }[] = [
		{ key: 'home', href: '/kitchen', label: 'Home', icon: 'M4 11.5 12 4l8 7.5M6 10v9.5h4.5V15h3v4.5H18V10' },
		{ key: 'treats', href: '/treats', label: 'Treats', icon: 'M4 9h16v4H4zM5.5 13h13v7h-13zM12 9v11M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6 0 6-1.5S14 5 12 9' },
		{ key: 'lucky', href: '/cupboard', label: 'Lucky', icon: 'M10 4c.6 3.4 2.6 5.4 6 6-3.4.6-5.4 2.6-6 6-.6-3.4-2.6-5.4-6-6 3.4-.6 5.4-2.6 6-6zM18 3c.3 1.4 1 2.1 2.4 2.4-1.4.3-2.1 1-2.4 2.4-.3-1.4-1-2.1-2.4-2.4 1.4-.3 2.1-1 2.4-2.4zM18 15c.3 1.4 1 2.1 2.4 2.4-1.4.3-2.1 1-2.4 2.4-.3-1.4-1-2.1-2.4-2.4 1.4-.3 2.1-1 2.4-2.4z' },
		{ key: 'vote', href: '/tasting', label: 'Vote', icon: 'M5 13h12a6 6 0 0 1-12 0zM17 13l2-9M8 10c0-1 1-1.5 1-2.5S8 6 8 5M12 10c0-1 1-1.5 1-2.5S12 6 12 5' },
		{ key: 'me', href: '/me', label: 'Me', icon: 'M3.5 15c0-4.5 3.8-8 8.5-8s8.5 3.5 8.5 8l-2.5 2H6zM9 8.2 8 16.5M15 8.2l1 8.3M12 7v9.5' }
	];
</script>

<header class="top">
	<div class="inner">
		{#if here.back}
			<a href="/me" class="back" aria-label="Back to Me">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
			</a>
		{:else}
			<span class="logo"><img src={ART.food.cookie} alt="" /></span>
		{/if}
		<div class="where">
			<span class="club">CRUMB CLUB</span>
			{#if title}<span class="title">{title}</span>{/if}
		</div>
		<a href="/recipe-book?tab=history" class="crumbs" aria-label="{data.balance} Crumbs, see history">
			<img src={ART.food.cookie} alt="" />
			<b>{data.balance}</b>
		</a>
	</div>
</header>

<main>
	{@render children()}
</main>

<nav class="tabs" aria-label="Crumb Club">
	<div class="bar">
		{#each tabs as t (t.key)}
			<a href={t.href} class:on={here.tab === t.key} aria-current={here.tab === t.key ? 'page' : undefined}>
				<span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={t.icon} /></svg></span>
				<span>{t.label}</span>
			</a>
		{/each}
	</div>
</nav>

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: 10;
		background: rgba(252, 248, 241, 0.94);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		padding: calc(10px + env(safe-area-inset-top)) 16px 10px;
	}
	.inner {
		max-width: var(--col);
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.logo {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--cream);
		border: 2px solid var(--ink);
		display: grid;
		place-items: center;
		flex: none;
	}
	.logo img {
		width: 28px;
	}
	.back {
		width: 40px;
		height: 40px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		color: var(--ink);
		flex: none;
	}
	.back svg {
		width: 24px;
		height: 24px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.where {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		line-height: 1.1;
	}
	.club {
		font: 800 0.8rem var(--body);
		letter-spacing: 0.08em;
		color: var(--maroon);
	}
	.where .club:only-child {
		font-size: 1.05rem;
		color: var(--ink);
	}
	.title {
		font: 800 1.2rem var(--body);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.crumbs {
		display: flex;
		align-items: center;
		gap: 5px;
		background: var(--butter);
		border: 2px solid var(--butter-dk);
		color: #6b5521;
		text-decoration: none;
		border-radius: 999px;
		padding: 6px 14px 6px 10px;
		font: 800 1rem var(--body);
	}
	.crumbs img {
		width: 20px;
		height: 20px;
	}
	main {
		max-width: var(--col);
		margin: 0 auto;
		padding: 8px 18px calc(var(--nav-h) + 40px + env(safe-area-inset-bottom));
	}
	.tabs {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10;
		padding: 0 14px calc(10px + env(safe-area-inset-bottom));
		pointer-events: none;
	}
	.bar {
		pointer-events: auto;
		max-width: calc(var(--col) - 8px);
		margin: 0 auto;
		height: var(--nav-h);
		display: flex;
		align-items: center;
		justify-content: space-around;
		background: var(--paper);
		border: 1.5px solid var(--line);
		border-radius: 999px;
		box-shadow: var(--soft-shadow);
		padding: 0 8px;
	}
	.bar a {
		flex: 1;
		max-width: 76px;
		height: 62px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1px;
		color: var(--ink);
		text-decoration: none;
		font-size: 0.78rem;
		font-weight: 600;
		border-radius: 999px;
		transition: background 0.15s;
	}
	.ico svg {
		display: block;
		width: 26px;
		height: 26px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.bar a.on {
		background: var(--butter);
		color: #5b4618;
		font-weight: 800;
	}
</style>
