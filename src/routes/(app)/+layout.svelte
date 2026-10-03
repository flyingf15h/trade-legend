<script lang="ts">
	import { page } from '$app/state';
	import { ART } from '#lib/art.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const tabs = [
		{ href: '/kitchen', label: 'Kitchen', icon: 'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z' },
		{ href: '/recipe-book', label: 'Recipe Book', icon: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8h6' },
		{ href: '/tasting', label: 'Tasting', icon: 'M8 3c3 0 4 3 4 5s-1.5 4-4 4-4-2-4-4 1-5 4-5zM8 12v9M15 3v18M15 3c2 0 4 2 4 5s-2 4-4 4' },
		{ href: '/cupboard', label: 'Cupboard', icon: 'M12 3a8 8 0 0 1 8 8H4a8 8 0 0 1 8-8zM4 11h16a8 8 0 0 1-16 0z' },
		{ href: '/invite', label: 'Invite', icon: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' }
	];
	const active = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(href + '/');
</script>

<header class="top">
	<div class="inner">
		<a href="/me" class="me" aria-label="Your profile">
			<img src={ART.avatar[data.member.icon]} alt="" />
		</a>
		<div class="brand">
			<span class="title">The Crumb Club</span>
			<span class="sub">at Grandma&rsquo;s Bakery</span>
		</div>
		<a href="/recipe-book" class="crumbs" aria-label="{data.balance} Crumbs">
			<img src={ART.food.cookie} alt="" />
			<b>{data.balance}</b>
		</a>
	</div>
</header>

<main>
	{@render children()}
</main>

<nav class="tabs" aria-label="Crumb Club">
	{#each tabs as t (t.href)}
		<a href={t.href} class:on={active(t.href)} aria-current={active(t.href) ? 'page' : undefined}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d={t.icon} /></svg>
			<span>{t.label}</span>
		</a>
	{/each}
</nav>

<style>
	.top {
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--maroon);
		color: var(--paper);
		padding: 10px 16px 8px;
		margin-bottom: 22px;
	}
	.top::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -14px;
		height: 14px;
		background: radial-gradient(circle at 16px 0, var(--maroon) 15px, transparent 16px) 0 0 / 32px 14px repeat-x;
	}
	.inner {
		max-width: 560px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.me img {
		width: 40px;
		height: 40px;
		display: block;
		border-radius: 50%;
		border: 2px solid var(--paper);
	}
	.brand {
		flex: 1;
		display: flex;
		flex-direction: column;
		line-height: 1.05;
	}
	.title {
		font: 600 1.15rem var(--display);
	}
	.sub {
		font-family: var(--hand);
		font-size: 1.05rem;
		opacity: 0.85;
	}
	.crumbs {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--paper);
		color: var(--maroon);
		text-decoration: none;
		border-radius: 999px;
		padding: 4px 12px 4px 5px;
		font-family: var(--display);
		font-size: 1.05rem;
	}
	.crumbs img {
		width: 26px;
		height: 26px;
	}
	main {
		max-width: 560px;
		margin: 0 auto;
		padding: 6px 16px calc(var(--nav-h) + 32px);
	}
	.tabs {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10;
		display: flex;
		justify-content: center;
		background: var(--paper);
		border-top: 2px solid var(--line);
		padding-bottom: env(safe-area-inset-bottom);
	}
	.tabs a {
		flex: 1;
		max-width: 112px;
		height: var(--nav-h);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		color: var(--muted);
		text-decoration: none;
		font-size: 0.72rem;
		font-weight: 600;
	}
	.tabs svg {
		width: 26px;
		height: 26px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.tabs a.on {
		color: var(--maroon);
	}
	.tabs a.on svg {
		fill: rgba(242, 201, 76, 0.55);
	}
</style>
