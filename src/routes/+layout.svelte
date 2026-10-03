<script lang="ts">
	import '@fontsource-variable/fraunces';
	import '@fontsource-variable/lora';
	import '@fontsource/caveat/600.css';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<meta name="theme-color" content="#7a2a25" />
</svelte:head>

{@render children()}
