<script lang="ts">
	import { ART } from '#lib/art.ts';
</script>

<header class="top">
	<span class="logo"><img src={ART.food.cookie} alt="" /></span>
	<span class="club">CRUMB CLUB</span>
	<span class="sub">at Grandma&rsquo;s Bakery</span>
</header>

<style>
	.top {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: calc(22px + env(safe-area-inset-top)) 16px 8px;
	}
	.logo {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--cream);
		border: 2px solid var(--ink);
		box-shadow: 2px 3px 0 var(--ink);
		display: grid;
		place-items: center;
		margin-bottom: 8px;
	}
	.logo img {
		width: 38px;
	}
	.club {
		font: 800 1.05rem var(--body);
		letter-spacing: 0.1em;
	}
	.sub {
		font-family: var(--hand);
		font-size: 1.2rem;
		color: var(--muted);
		margin-top: -2px;
	}
</style>
