<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { selectedDocument } from '$lib/stores/documentStore';
	import { photoState } from '$lib/stores/photoStore';
	import Button from '$lib/components/Button.svelte';
	import { get } from 'svelte/store';

	let videoEl: HTMLVideoElement;
	let canvasEl: HTMLCanvasElement;
	let stream: MediaStream | null = null;
	let facingMode: 'user' | 'environment' = 'user';
	let isCapturing = false;

	const doc = get(selectedDocument);
	if (browser && !doc) {
		goto('/create/select-document');
	}

	async function startCamera() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode,
					width: { ideal: 1280 },
					height: { ideal: 720 }
				}
			});
			if (videoEl) {
				videoEl.srcObject = stream;
			}
		} catch (error) {
			console.error('Error accessing camera:', error);
			alert('Unable to access camera. Please check permissions.');
		}
	}

	function switchCamera() {
		facingMode = facingMode === 'user' ? 'environment' : 'user';
		if (stream) {
			stopCamera();
			startCamera();
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
	}

	async function capturePhoto() {
		if (!videoEl || !canvasEl || !doc) return;

		isCapturing = true;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		canvasEl.width = videoEl.videoWidth;
		canvasEl.height = videoEl.videoHeight;
		ctx.drawImage(videoEl, 0, 0);

		const imageData = canvasEl.toDataURL('image/png');
		const img = new Image();
		img.src = imageData;

		img.onload = () => {
			photoState.update((state) => ({
				...state,
				originalImage: img
			}));
			stopCamera();
			goto('/create/align');
		};

		isCapturing = false;
	}

	onMount(() => {
		startCamera();
	});

	onDestroy(() => {
		stopCamera();
	});
</script>

<svelte:head>
	<title>Camera - PassportID</title>
</svelte:head>

<div class="container py-12">
	<h1 class="text-3xl font-bold mb-8">Take Photo</h1>

	{#if doc}
		<div class="relative bg-slate-900 rounded-lg overflow-hidden aspect-video mb-6">
			<video
				bind:this={videoEl}
				autoplay
				playsinline
				class="w-full h-full object-cover"
			>
				<track kind="captions" />
			</video>
			<canvas bind:this={canvasEl} class="hidden"></canvas>

			<!-- Document frame overlay -->
			{#if doc}
				<div
					class="absolute inset-0 flex items-center justify-center pointer-events-none"
				>
					<div
						class="border-2 border-accent-500 border-dashed rounded-lg"
						style="width: {doc.requirements.width / 10}px; height: {doc.requirements.height / 10}px; aspect-ratio: {doc.requirements.width} / {doc.requirements.height};"
					></div>
				</div>
			{/if}
		</div>

		<div class="flex gap-4 justify-center">
			<Button on:click={switchCamera} variant="secondary">
				Switch Camera
			</Button>
			<Button on:click={capturePhoto} disabled={isCapturing} size="lg">
				{isCapturing ? 'Capturing...' : 'Capture Photo'}
			</Button>
		</div>

		<div class="mt-8 text-center">
			<p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
				Or upload a photo instead
			</p>
			<Button on:click={() => goto('/create/upload')} variant="ghost">
				Upload Photo
			</Button>
		</div>
	{/if}
</div>

