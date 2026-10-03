<script lang="ts">
	import '@fontsource/chewy';
	import '@fontsource-variable/nunito';
	import '@fontsource/gaegu/400.css';
	import '@fontsource/gaegu/700.css';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<meta name="theme-color" content="#fcf8f1" />
</svelte:head>

{@render children()}
