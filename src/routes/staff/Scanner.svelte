<script lang="ts">
	import { onDestroy } from 'svelte';

	let { onscan }: { onscan: (text: string) => void } = $props();

	// Uses the browser's built-in BarcodeDetector (Chrome on Android, Safari 17+). Where it's
	// missing, staff can still type the code or phone number.
	type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
	const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window;
	let on = $state(false);
	let problem = $state<string | null>(null);
	let video: HTMLVideoElement | undefined = $state();
	let stream: MediaStream | null = null;
	let timer = 0;

	async function startScan() {
		problem = null;
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
		} catch {
			problem = 'Couldn’t open the camera.';
			return;
		}
		on = true;
		await Promise.resolve();
		video!.srcObject = stream;
		await video!.play();
		const detector: Detector = new (window as unknown as { BarcodeDetector: new (o: object) => Detector }).BarcodeDetector({
			formats: ['qr_code']
		});
		const tick = async () => {
			if (!on || !video) return;
			const codes = await detector.detect(video).catch(() => []);
			if (codes.length) {
				stop();
				onscan(codes[0].rawValue);
				return;
			}
			timer = window.setTimeout(tick, 250);
		};
		tick();
	}

	function stop() {
		on = false;
		clearTimeout(timer);
		stream?.getTracks().forEach((t) => t.stop());
		stream = null;
	}
	onDestroy(stop);
</script>

{#if supported}
	<div class="scan">
		{#if on}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video bind:this={video} playsinline muted></video>
			<button class="btn soft" onclick={stop}>Stop scanning</button>
		{:else}
			<button class="btn butter" onclick={startScan}>Scan a QR code</button>
		{/if}
		{#if problem}<p class="error">{problem}</p>{/if}
	</div>
{/if}

<style>
	.scan {
		margin: 12px 0;
		text-align: center;
	}
	video {
		width: 100%;
		max-width: 420px;
		border-radius: 14px;
		display: block;
		margin: 0 auto 10px;
		background: #000;
	}
</style>
