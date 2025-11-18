<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { selectedDocument } from '$lib/stores/documentStore';
	import { photoState } from '$lib/stores/photoStore';
	import StepLayout from '$lib/components/StepLayout.svelte';
	import StepActionBar from '$lib/components/StepActionBar.svelte';
	import Button from '$lib/components/Button.svelte';
	import { get } from 'svelte/store';

	const backIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>';
	const resetIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>';

	function goBack() {
		goto('/create/edit');
	}

	function resetFlow() {
		selectedDocument.set(null);
		photoState.set({});
		goto('/create/select-document');
	}

	$: leftActions = [
		{
			label: 'Back',
			onClick: goBack,
			variant: 'ghost' as const,
			icon: backIcon
		},
		{
			label: 'Start Over',
			onClick: resetFlow,
			variant: 'ghost' as const,
			icon: resetIcon
		}
	];

	let canvasEl: HTMLCanvasElement;
	let format: 'png' | 'jpeg' = 'png';
	let quality = 0.92;
	let showResetConfirm = false;

	const doc = get(selectedDocument);
	const photo = get(photoState);

	if (browser && (!doc || !photo.editedImage)) {
		goto('/create/select-document');
	}

	let windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
	let windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

	const MIN_CAMERA_HEIGHT = 320;
	const MAX_CAMERA_HEIGHT = 640;
	const DEFAULT_CAMERA_WIDTH = 640;
	let imageAspect = 3 / 4;

	// Calculate canvas dimensions same as align page
	$: desiredCameraHeight = Math.min(windowHeight * 0.5, MAX_CAMERA_HEIGHT);
	$: cameraHeight = Math.max(MIN_CAMERA_HEIGHT, desiredCameraHeight);
	$: safeViewportWidth = windowWidth || 1024;
	$: cameraWidth = cameraHeight * imageAspect;
	$: cameraWidthClamped = Math.max(240, Math.min(cameraWidth, safeViewportWidth));
	$: cameraRenderWidth = Math.max(240, Math.min(cameraWidthClamped, safeViewportWidth - 32));
	$: cameraContainerWidth = cameraRenderWidth > 0 ? cameraRenderWidth : DEFAULT_CAMERA_WIDTH;

	function handleResize() {
		if (typeof window !== 'undefined') {
			windowWidth = window.innerWidth;
			windowHeight = window.innerHeight;
		}
	}

	function updateImageAspect() {
		if (photo.editedImage) {
			const width = photo.editedImage.width;
			const height = photo.editedImage.height;
			if (width > 0 && height > 0) {
				imageAspect = width / height;
			}
		}
	}

	onMount(() => {
		if (photo.editedImage && canvasEl) {
			const ctx = canvasEl.getContext('2d');
			if (!ctx) return;

			canvasEl.width = photo.editedImage.width;
			canvasEl.height = photo.editedImage.height;
			ctx.drawImage(photo.editedImage, 0, 0);
			updateImageAspect();
		}
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', handleResize);
			handleResize();
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', handleResize);
		}
	});

	function downloadImage() {
		if (!canvasEl) return;

		const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
		const extension = format === 'png' ? 'png' : 'jpg';
		const dataUrl = canvasEl.toDataURL(mimeType, format === 'jpeg' ? quality : undefined);

		const link = document.createElement('a');
		link.download = `${doc?.name || 'photo'}.${extension}`;
		link.href = dataUrl;
		link.click();
	}

	function handleCreateAnother() {
		showResetConfirm = true;
	}

	function confirmReset() {
		selectedDocument.set(null);
		photoState.set({});
		showResetConfirm = false;
		goto('/create/select-document');
	}

	function cancelReset() {
		showResetConfirm = false;
	}

	function handleBackdropKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			cancelReset();
		}
	}

	function handleModalClick(e: MouseEvent) {
		// Close modal if clicking on backdrop (not on modal content)
		if (e.target === e.currentTarget) {
			cancelReset();
		}
	}

</script>

<svelte:head>
	<title>Export Photo - PassportID</title>
</svelte:head>

<StepLayout currentStep={5} title="Export Final Result">
	{#if doc && photo.editedImage}
		<div class="grid lg:grid-cols-3 gap-8 pb-24">
			<!-- Preview Area -->
			<div class="lg:col-span-2">
				<div class="space-y-6">
					<div
						class="relative bg-slate-900 rounded-lg overflow-hidden mx-auto flex items-center justify-center"
						style={`height: ${cameraHeight}px; width: ${cameraContainerWidth}px; max-width: 100%;`}
					>
						<canvas
							bind:this={canvasEl}
							class="object-contain rounded max-w-full max-h-full"
						></canvas>
					</div>
				</div>
			</div>

			<!-- Export Options Panel -->
			<div class="lg:col-span-1 space-y-6">
				<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
					<h2 class="text-lg font-medium mb-6">Export Options</h2>

					<div class="space-y-6">
						<!-- Format -->
						<div>
							<label for="format-group" class="block text-sm font-medium mb-3">Format</label>
							<div id="format-group" class="flex gap-4">
								<label class="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										value="png"
										bind:group={format}
										class="w-4 h-4 text-primary border-border focus:ring-primary"
									/>
									<span class="text-sm">PNG</span>
								</label>
								<label class="flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										value="jpeg"
										bind:group={format}
										class="w-4 h-4 text-primary border-border focus:ring-primary"
									/>
									<span class="text-sm">JPEG</span>
								</label>
							</div>
						</div>

						{#if format === 'jpeg'}
							<!-- Quality -->
							<div>
								<label for="quality-slider" class="block text-sm font-medium mb-2">
									Quality: {Math.round(quality * 100)}%
								</label>
								<input
									id="quality-slider"
									type="range"
									min="0.1"
									max="1"
									step="0.01"
									bind:value={quality}
									class="w-full accent-primary"
								/>
							</div>
						{/if}

						<!-- Document Info -->
						<div class="pt-4 border-t border-slate-200 dark:border-slate-700">
							<div class="space-y-3 text-sm">
								<div>
									<p class="text-slate-600 dark:text-slate-400 mb-1">Size</p>
									<p class="font-medium">
										{photo.editedImage.width} × {photo.editedImage.height}px
									</p>
									<p class="text-xs text-muted-foreground mt-1">
										Calculated from document requirements
									</p>
								</div>
								<div>
									<p class="text-slate-600 dark:text-slate-400 mb-1">DPI</p>
									<p class="font-medium">{doc.requirements.dpi}</p>
									<p class="text-xs text-muted-foreground mt-1">
										Required by {doc.name}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="text-center py-12 pb-24">
			<p class="text-slate-600 dark:text-slate-400 mb-4">No photo to export</p>
		</div>
	{/if}
	
	<style>
		/* Use primary color for accent on form controls */
		:global(input[type="radio"].accent-primary),
		:global(input[type="range"].accent-primary) {
			accent-color: hsl(var(--primary));
		}
	</style>
	
	<!-- Primary Action Bar -->
	{#if doc && photo.editedImage}
		<StepActionBar
			primaryAction={{
				label: 'Download Photo',
				onClick: downloadImage
			}}
			secondaryActions={[
				{
					label: 'Create Another Photo',
					onClick: handleCreateAnother,
					variant: 'outline'
				}
			]}
			leftActions={leftActions}
		/>
	{:else}
		<StepActionBar
			primaryAction={{
				label: 'Start Over',
				onClick: () => goto('/create/select-document')
			}}
			leftActions={[
				{
					label: 'Back',
					onClick: goBack,
					variant: 'ghost',
					icon: backIcon
				}
			]}
		/>
	{/if}
</StepLayout>

<!-- Reset Confirmation Modal -->
{#if showResetConfirm}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center"
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<!-- Backdrop -->
		<button
			type="button"
			class="fixed inset-0 bg-black/50 backdrop-blur-sm border-0 p-0 cursor-default"
			on:click={cancelReset}
			on:keydown={handleBackdropKeydown}
			aria-label="Close modal"
			tabindex="-1"
		></button>
		
		<!-- Modal Content -->
		<div
			class="relative bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
		>
			<h2 id="modal-title" class="text-xl font-semibold mb-2">Create Another Photo?</h2>
			<p class="text-muted-foreground mb-6">
				This will reset your current progress and start a new photo. Make sure you've downloaded your current photo if needed.
			</p>
			<div class="flex gap-3 justify-end">
				<Button variant="outline" on:click={cancelReset} size="sm">
					Cancel
				</Button>
				<Button variant="default" on:click={confirmReset} size="sm">
					Create Another
				</Button>
			</div>
		</div>
	</div>
{/if}

