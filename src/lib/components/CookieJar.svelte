<script lang="ts">
	import { ART } from '#lib/art.ts';

	// The loyalty "point box": a smiling pixel jar that fills with cookies as you near the next
	// reward. progress is 0..1.
	let { progress = 0 }: { progress?: number } = $props();
	let cookies = $derived(Math.max(1, Math.round(progress * 8)));
</script>

<img
	src={ART.jar(cookies)}
	alt="Cookie jar, {Math.round(progress * 100)}% of the way to your next reward"
	class="jar"
/>

<style>
	.jar {
		display: block;
		width: 150px;
		margin: 0 auto;
		animation: hop 2.4s steps(2) infinite;
	}
	@keyframes hop {
		50% {
			transform: translateY(-4px);
		}
	}
</style>
