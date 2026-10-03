<script lang="ts">
	// The loyalty "point box": a smiling jar that fills with cookies as you near the next reward.
	// progress is 0..1. Swap for the hand-drawn jar later by replacing this markup with an <img>.
	let { progress = 0 }: { progress?: number } = $props();

	const spots = [
		[50, 112], [70, 114], [60, 100], [40, 102], [80, 103], [50, 89], [70, 90], [60, 77]
	];
	let shown = $derived(Math.max(1, Math.round(progress * spots.length)));
</script>

<svg viewBox="0 0 120 140" class="jar" role="img" aria-label="Cookie jar, {Math.round(progress * 100)}% of the way to your next reward">
	<!-- lid -->
	<rect x="52" y="4" width="16" height="8" rx="4" fill="#fbe8a6" stroke="#3a2a25" stroke-width="2.5" />
	<ellipse cx="60" cy="16" rx="30" ry="6" fill="#fbe8a6" stroke="#3a2a25" stroke-width="2.5" />
	<!-- glass -->
	<path d="M33 22 Q30 22 30 30 V118 Q30 132 46 132 H74 Q90 132 90 118 V30 Q90 22 87 22Z" fill="#fff" stroke="#3a2a25" stroke-width="2.5" />
	<ellipse cx="60" cy="122" rx="26" ry="7" fill="#fbe8a6" opacity=".8" />
	{#each spots.slice(0, shown) as [x, y], i (i)}
		<g class="cookie" style="animation-delay:{i * 70}ms">
			<circle cx={x} cy={y} r="10" fill="#e3b264" stroke="#3a2a25" stroke-width="2" />
			<circle cx={x - 3} cy={y - 3} r="1.6" fill="#5a3a24" />
			<circle cx={x + 3} cy={y + 1} r="1.6" fill="#5a3a24" />
			<circle cx={x - 1} cy={y + 4} r="1.3" fill="#5a3a24" />
		</g>
	{/each}
	<path d="M38 34 V90" stroke="#d4e8d6" stroke-width="4" stroke-linecap="round" />
	<!-- face -->
	<circle cx="52" cy="54" r="2.6" fill="#3a2a25" />
	<circle cx="68" cy="54" r="2.6" fill="#3a2a25" />
	<path d="M56 59 q4 4 8 0" fill="none" stroke="#3a2a25" stroke-width="2" stroke-linecap="round" />
	<ellipse cx="45" cy="58" rx="4" ry="2.3" fill="#fea9a6" opacity=".7" />
	<ellipse cx="75" cy="58" rx="4" ry="2.3" fill="#fea9a6" opacity=".7" />
</svg>

<style>
	.jar {
		display: block;
		width: 150px;
		margin: 0 auto;
	}
	.cookie {
		animation: drop 0.5s cubic-bezier(0.3, 1.5, 0.5, 1) both;
	}
	@keyframes drop {
		from {
			transform: translateY(-40px);
			opacity: 0;
		}
	}
</style>
