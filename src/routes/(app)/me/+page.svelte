<script lang="ts">
	import { ART } from '#lib/art.ts';
	import { EARN } from '#lib/rewards.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let rows = $derived([
		{ href: '/recipe-book', label: 'My Rewards', icon: 'ticket', tint: 'pink', note: data.ready ? `${data.ready} ready` : '' },
		{ href: '/recipe-book?tab=history', label: 'Crumb History', icon: 'receipt', tint: 'butter', note: '' },
		{ href: '/invite', label: 'Refer a Friend', icon: 'heart', tint: 'pink', note: `+${EARN.referrer}` },
		{ href: '/me/settings#birthday', label: 'Birthday Treat', icon: 'cake', tint: 'mint', note: data.birthday ? '' : 'add date' },
		{
			href: '/me/settings#review',
			label: 'Leave a Review',
			icon: 'star',
			tint: 'butter',
			note: data.review === 'approved' ? 'thank you!' : data.review === 'pending' ? 'checking' : `+${EARN.review}`
		},
		{ href: '/card', label: 'My QR Code', icon: 'qr', tint: 'grey', note: '' }
	]);
</script>

<svelte:head><title>Me · Crumb Club</title></svelte:head>

<section class="who">
	<a href="/me/settings" class="avatar" aria-label="Edit my details">
		<img src={ART.avatar[data.member.icon]} alt="" />
		<span class="edit" aria-hidden="true">✎</span>
	</a>
	<h1>{data.member.name}</h1>
	<span class="pill butter big"><img src={ART.food.cookie} alt="" /> {data.balance} Crumbs</span>
</section>

<ul class="rows">
	{#each rows as r (r.label)}
		<li>
			<a href={r.href}>
				<span class="ic {r.tint}" aria-hidden="true"><img src={ART.icon[r.icon]} alt="" /></span>
				<span class="lbl">{r.label}</span>
				{#if r.note}<span class="note-txt">{r.note}</span>{/if}
				<span class="chev" aria-hidden="true">›</span>
			</a>
		</li>
	{/each}
</ul>

<form method="POST" action="/logout" class="out">
	<button class="linkish">Sign out</button>
</form>

<style>
	.who {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 8px 0 22px;
	}
	.avatar {
		position: relative;
		width: 112px;
		height: 112px;
		border-radius: 50%;
		background: #fff;
		border: 5px solid var(--pink);
		box-shadow: 0 0 0 2px #f2bcbc;
		display: grid;
		place-items: center;
	}
	.avatar img {
		width: 92px;
	}
	.edit {
		position: absolute;
		right: -2px;
		bottom: 2px;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--butter);
		border: 2px solid var(--butter-dk);
		display: grid;
		place-items: center;
		font-size: 0.9rem;
		color: #6b5521;
	}
	h1 {
		color: var(--maroon);
		font-size: 2.6rem;
		margin: 10px 0 6px;
	}
	.big {
		font: 400 1.25rem var(--display);
		padding: 8px 18px;
	}
	.big img {
		width: 22px;
	}
	.rows {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.rows a {
		display: flex;
		align-items: center;
		gap: 14px;
		background: var(--paper);
		border: 1.5px solid var(--line);
		border-radius: 20px;
		padding: 12px 16px 12px 12px;
		min-height: 66px;
		color: var(--ink);
		text-decoration: none;
	}
	.rows a:active {
		background: var(--cream);
	}
	.ic {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 1.2rem;
		flex: none;
	}
	.ic img {
		width: 24px;
		height: 24px;
		object-fit: contain;
	}
	.ic.pink {
		background: var(--pink);
	}
	.ic.butter {
		background: var(--butter);
	}
	.ic.mint {
		background: var(--mint);
	}
	.ic.grey {
		background: #ebe7e2;
	}
	.lbl {
		flex: 1;
		font-weight: 800;
		font-size: 1.1rem;
	}
	.note-txt {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--maroon);
	}
	.chev {
		font-size: 1.5rem;
		color: var(--muted);
	}
	.out {
		text-align: center;
		margin-top: 26px;
	}
</style>
