<script lang="ts">
	import { ART } from '#lib/art.ts';
	import { EARN } from '#lib/rewards.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Welcome to the Crumb Club</title></svelte:head>

<div class="welcome">
	<img src={ART.avatar[data.member.icon]} alt="" class="pal" />
	<p class="note big">There you are, {data.member.name}! I&rsquo;ve saved you a place at the table.<br /><span>&mdash; Grandma</span></p>

	<div class="card how">
		<h2>How the Crumb Club works</h2>
		<p><b>Crumbs</b> are your loyalty points. Show your card at the counter and you&rsquo;ll get <b>5 Crumbs for every $1</b>.</p>
		<ul>
			<li><img src={ART.food.parfait} alt="" /> <span>Vote on next month&rsquo;s flavour for <b>{EARN.vote}</b> Crumbs</span></li>
			<li><img src={ART.capsule.pink} alt="" /> <span>One free turn a day at the Lucky Cupboard</span></li>
			<li><img src={ART.food.cookie} alt="" /> <span>Trade Crumbs for treats from <b>100</b></span></li>
			<li><img src={ART.food.cake} alt="" /> <span>Add your birthday for a pastry on Grandma</span></li>
		</ul>
	</div>

	<a href="/cupboard" class="btn butter block">Take your first free turn</a>
	<a href="/kitchen" class="btn soft block">Go to Grandma&rsquo;s Kitchen</a>
</div>

<style>
	.welcome {
		text-align: center;
	}
	.pal {
		width: 110px;
		animation: hop 1.2s ease-in-out infinite;
	}
	@keyframes hop {
		50% {
			transform: translateY(-8px) rotate(-3deg);
		}
	}
	.big {
		margin: 18px 6px 22px;
		font-size: 1.7rem;
	}
	.big span {
		font-size: 1.3rem;
	}
	.how {
		text-align: left;
		margin-bottom: 18px;
	}
	.how ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.how li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 0;
		border-top: 1px dashed var(--line);
	}
	.how li img {
		width: 34px;
		flex: none;
	}
	.btn + .btn {
		margin-top: 10px;
	}
</style>
