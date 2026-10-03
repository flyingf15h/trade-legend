<script lang="ts">
	import { ART } from '#lib/art.ts';
	import { EARN } from '#lib/rewards.ts';
	import { money, shortDate } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let copied = $state(false);

	async function share() {
		const text = `Come join me in the Crumb Club at Grandma's Bakery! You get ${EARN.referee} Crumbs after your first visit.`;
		if (navigator.share) {
			try {
				await navigator.share({ title: 'The Crumb Club', text, url: data.link });
				return;
			} catch {
				// cancelled; fall through to copying
			}
		}
		await navigator.clipboard?.writeText(data.link);
		copied = true;
		setTimeout(() => (copied = false), 2500);
	}

	const STEPS = ['invited', 'joined', 'completed'];
	const LABEL: Record<string, string> = { invited: 'Invited', joined: 'Joined', completed: 'First visit done' };
	let earned = $derived(data.referrals.filter((r) => r.status === 'completed').length * EARN.referrer);
</script>

<svelte:head><title>Invite a Neighbour · Crumb Club</title></svelte:head>

<h1>Invite a Neighbour</h1>
<p class="lead">There&rsquo;s always room for one more at Grandma&rsquo;s table.</p>

<section class="card invite">
	<div class="gifts">
		<div><b>+{EARN.referrer}</b><span>for you</span></div>
		<img src={ART.food.bogo} alt="" />
		<div><b>+{EARN.referee}</b><span>for them</span></div>
	</div>
	<p class="small">
		Once your friend joins with your link and spends {money(EARN.referralMinCents)} or more on their first visit, you both get Crumbs.
	</p>
	<div class="qr">{@html data.qr}</div>
	<p class="link">{data.link.replace(/^https?:\/\//, '')}</p>
	<button class="btn block" onclick={share}>{copied ? 'Link copied!' : 'Share my invite'}</button>
</section>

<section class="list">
	<div class="spread">
		<h2>Your neighbours</h2>
		{#if earned}<span class="pill mint">{earned} Crumbs earned</span>{/if}
	</div>
	{#if data.referrals.length === 0}
		<p class="muted">No one yet. Send your link to someone who&rsquo;d love a warm croissant.</p>
	{/if}
	{#each data.referrals as r (r.id)}
		{@const at = STEPS.indexOf(r.status)}
		<div class="ref recipe-card">
			<div class="spread">
				<b>{r.name ?? 'Someone opened your invite'}</b>
				<small class="muted">{shortDate(r.createdAt)}</small>
			</div>
			<ol class="steps">
				{#each STEPS as s, i (s)}
					<li class:done={i <= at}>{LABEL[s]}</li>
				{/each}
			</ol>
		</div>
	{/each}
	<p class="small muted">Rewards are for brand-new members, one referrer per person, up to {EARN.referralMonthlyLimit} a month.</p>
</section>

<style>
	.lead {
		font-family: var(--hand);
		font-size: 1.4rem;
	}
	.invite {
		text-align: center;
	}
	.gifts {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
		margin-bottom: 8px;
	}
	.gifts img {
		height: 56px;
	}
	.gifts div {
		display: flex;
		flex-direction: column;
		line-height: 1;
	}
	.gifts b {
		font: 700 1.8rem var(--display);
		color: var(--maroon);
	}
	.gifts span {
		font-family: var(--hand);
		font-size: 1.2rem;
		color: var(--muted);
	}
	.qr {
		width: 180px;
		height: 180px;
		margin: 6px auto 0;
	}
	.qr :global(svg) {
		width: 100%;
		height: 100%;
	}
	.link {
		font: 600 0.95rem var(--display);
		color: var(--maroon);
		word-break: break-all;
	}
	.list {
		margin-top: 24px;
	}
	.ref {
		margin-bottom: 12px;
		line-height: 28px;
	}
	.steps {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		gap: 4px;
		font-size: 0.8rem;
	}
	.steps li {
		flex: 1;
		text-align: center;
		border-radius: 999px;
		background: var(--cream);
		color: var(--muted);
		line-height: 1.2;
		padding: 4px 2px;
	}
	.steps li.done {
		background: var(--mint);
		color: #1f4a2e;
		font-weight: 600;
	}
</style>
