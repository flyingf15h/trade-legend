<script lang="ts">
	import { onMount } from 'svelte';
	import { ART } from '#lib/art.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// keep the screen awake while it's being scanned, where the browser allows it
	onMount(() => {
		let lock: { release: () => Promise<void> } | null = null;
		const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
		nav.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {});
		return () => lock?.release();
	});
</script>

<svelte:head><title>My QR Code · Crumb Club</title></svelte:head>

<div class="card qr-card">
	<img src={ART.avatar[data.member.icon]} alt="" class="pal" />
	<h1>{data.member.name}</h1>
	<div class="qr">{@html data.qr}</div>
	<p class="code">{data.member.cardCode}</p>
	<p class="pill butter"><img src={ART.food.cookie} alt="" /> {data.balance} Crumbs</p>
</div>
<p class="hand center hint">Show this at the counter to earn or spend Crumbs <img src={ART.icon.sparkle} alt="" class="px-ico" /></p>

<style>
	.qr-card {
		text-align: center;
		margin-top: 10px;
	}
	.pal {
		width: 64px;
	}
	h1 {
		color: var(--maroon);
		margin: 4px 0 8px;
	}
	.qr {
		width: min(260px, 70vw);
		aspect-ratio: 1;
		margin: 0 auto;
	}
	.qr :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
	}
	.code {
		font: 800 1.05rem var(--body);
		letter-spacing: 0.12em;
		margin: 6px 0 10px;
	}
	.pill img {
		width: 18px;
	}
	.hint {
		font-size: 1.35rem;
		margin-top: 18px;
	}
</style>
