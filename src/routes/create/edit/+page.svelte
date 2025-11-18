<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { selectedDocument } from '$lib/stores/documentStore';
	import { photoState } from '$lib/stores/photoStore';
	import {
		applyFilters,
		replaceBackground
	} from '$lib/canvas/imageProcessing';
	import { removeBackground } from '$lib/canvas/backgroundRemoval';
	import ColorPicker from '$lib/components/ColorPicker.svelte';
	import StepLayout from '$lib/components/StepLayout.svelte';
	import StepActionBar from '$lib/components/StepActionBar.svelte';
	import { get } from 'svelte/store';

	const backIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>';
	const resetIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>';

	function goBack() {
		goto('/create/align');
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
	let originalCanvasEl: HTMLCanvasElement;
	let editedImageEl: HTMLImageElement;
	let originalImageEl: HTMLImageElement;
	let removeBg = false;
	let backgroundColor: string | null = '#ffffff';
	let previousBackgroundColor: string | null = null; // Store previous color when switching to transparent
	let brightness = 1;
	let contrast = 1;
	let exposure = 0;
	let showOriginal = false;
	let activeTab: 'background' | 'adjustments' = 'background';
	let isProcessingBg = false;

	const doc = get(selectedDocument);
	const photo = get(photoState);

	if (browser && (!doc || !photo.canvas)) {
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
		if (canvasEl && canvasEl.width > 0 && canvasEl.height > 0) {
			imageAspect = canvasEl.width / canvasEl.height;
		} else if (photo.canvas) {
			const width = photo.canvas.width;
			const height = photo.canvas.height;
			if (width > 0 && height > 0) {
				imageAspect = width / height;
			}
		}
	}

	$: if (backgroundColor !== null || brightness !== 1 || contrast !== 1 || exposure !== 0) {
		updatePreview();
	}

	// Handle background removal when checkbox changes
	function handleRemoveBgChange() {
		handleBackgroundRemoval();
	}

	onMount(() => {
		updatePreview();
		// Initialize original view after DOM is ready
		requestAnimationFrame(() => {
			updateOriginalView();
		});
		updateImageAspect();
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

	async function handleBackgroundRemoval() {
		// Get fresh photo state
		const currentPhoto = get(photoState);
		if (!currentPhoto.canvas || !canvasEl) return;

		if (removeBg) {
			isProcessingBg = true;
			try {
				// Use alignedImage if available, otherwise use canvas
				const sourceCanvas = currentPhoto.alignedImage instanceof HTMLCanvasElement 
					? currentPhoto.alignedImage 
					: currentPhoto.canvas;
				
				if (!sourceCanvas) {
					console.error('No source canvas available for background removal');
					removeBg = false;
					isProcessingBg = false;
					return;
				}

				const processedCanvas = await removeBackground(sourceCanvas);
				
				// Store the background-removed version
				photoState.update((state) => ({
					...state,
					canvasWithoutBg: processedCanvas
				}));
				
				// Update preview with fresh state
				updatePreview();
			} catch (error) {
				console.error('Background removal failed:', error);
				removeBg = false;
			} finally {
				isProcessingBg = false;
			}
		} else {
			// Clear the background-removed version when toggled off
			photoState.update((state) => ({
				...state,
				canvasWithoutBg: undefined
			}));
			updatePreview();
		}
	}

	function updatePreview() {
		// Get fresh photo state
		const currentPhoto = get(photoState);
		if (!currentPhoto.canvas || !canvasEl) return;

		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		// Start with the base canvas (with or without background)
		let processedCanvas = removeBg && currentPhoto.canvasWithoutBg 
			? currentPhoto.canvasWithoutBg 
			: currentPhoto.canvas;

		// Apply filters
		processedCanvas = applyFilters(processedCanvas, brightness, contrast, exposure);

		// Apply background color only if specified
		if (backgroundColor !== null) {
			processedCanvas = replaceBackground(processedCanvas, backgroundColor);
		}

		// Draw to preview canvas - keep natural size for proper scaling
		canvasEl.width = processedCanvas.width;
		canvasEl.height = processedCanvas.height;
		ctx.drawImage(processedCanvas, 0, 0);

		// Convert canvas to image for proper object-fit display
		if (editedImageEl) {
			editedImageEl.src = canvasEl.toDataURL();
		}

		// Update image aspect ratio
		updateImageAspect();

		// Update photo state
		photoState.update((state) => ({
			...state,
			editedImage: processedCanvas
		}));
	}

	function updateOriginalView() {
		if (!originalCanvasEl || !originalImageEl) return;

		// Get fresh photo state
		const currentPhoto = get(photoState);
		
		const originalCtx = originalCanvasEl.getContext('2d');
		if (!originalCtx) return;

		// Use alignedImage from align step, fallback to canvas
		const originalSource = currentPhoto.alignedImage instanceof HTMLCanvasElement
			? currentPhoto.alignedImage
			: currentPhoto.canvas;
		
		if (!originalSource) return;

		try {
			originalCanvasEl.width = originalSource.width;
			originalCanvasEl.height = originalSource.height;
			originalCtx.drawImage(originalSource, 0, 0);
			
			// Convert canvas to image for proper object-fit display
			originalImageEl.src = originalCanvasEl.toDataURL();
		} catch (error) {
			console.error('Error updating original view:', error);
		}
	}

	// No reactive statement - we'll update manually when needed

	function proceedToExport() {
		updatePreview();
		goto('/create/export');
	}
</script>

<svelte:head>
	<title>Enhance Photo - PassportID</title>
</svelte:head>

<StepLayout currentStep={4} title="Enhance Your Photo">
	<div class="grid lg:grid-cols-3 gap-8 pb-24">
		<!-- Preview -->
		<div class="lg:col-span-2">
			<div class="space-y-6">
				<!-- Toggle for Original/Edited -->
				<div class="flex justify-center">
					<div class="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-1">
						<button
							type="button"
							on:click={() => {
								showOriginal = false;
							}}
							class="px-4 py-2 text-sm font-medium rounded-md transition-all"
							class:bg-primary={!showOriginal}
							class:text-white={!showOriginal}
							class:text-slate-700={showOriginal}
							class:dark:text-slate-300={showOriginal}
						>
							Edited
						</button>
						<button
							type="button"
							on:click={() => {
								showOriginal = true;
								// Use requestAnimationFrame to ensure DOM is updated
								requestAnimationFrame(() => {
									updateOriginalView();
								});
							}}
							class="px-4 py-2 text-sm font-medium rounded-md transition-all"
							class:bg-primary={showOriginal}
							class:text-white={showOriginal}
							class:text-slate-700={!showOriginal}
							class:dark:text-slate-300={!showOriginal}
						>
							Original
						</button>
					</div>
				</div>

				<div
					class="relative bg-slate-900 rounded-lg overflow-hidden mx-auto flex items-center justify-center"
					style={`height: ${cameraHeight}px; width: ${cameraContainerWidth}px; max-width: 100%;`}
				>
					<!-- Checkerboard pattern for transparent background -->
					<div
						class="absolute inset-0 opacity-40"
						style="background-image: 
							linear-gradient(45deg, #e5e5e5 25%, transparent 25%), 
							linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), 
							linear-gradient(45deg, transparent 75%, #e5e5e5 75%), 
							linear-gradient(-45deg, transparent 75%, #e5e5e5 75%);
							background-size: 20px 20px;
							background-position: 0 0, 0 10px, 10px -10px, -10px 0px;"
					></div>
					<canvas bind:this={canvasEl} class="hidden"></canvas>
					<canvas bind:this={originalCanvasEl} class="hidden"></canvas>
					<img
						bind:this={editedImageEl}
						class="rounded max-w-full max-h-full object-contain absolute inset-0"
						style="width: 100%; height: 100%;"
						class:hidden={showOriginal}
						alt="Edited preview"
					/>
					<img
						bind:this={originalImageEl}
						class="rounded max-w-full max-h-full object-contain absolute inset-0"
						style="width: 100%; height: 100%;"
						class:hidden={!showOriginal}
						alt="Original preview"
					/>
					<!-- Loading overlay for background removal -->
					{#if isProcessingBg}
						<div class="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
							<div class="text-center">
								<div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
								<p class="text-white text-sm font-medium">Removing background...</p>
								<p class="text-white/70 text-xs mt-1">This may take a few seconds</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Tools Panel -->
		<div class="lg:col-span-1 space-y-6">
			<div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
				<!-- Tabs -->
				<div class="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
					<button
						type="button"
						on:click={() => (activeTab = 'background')}
						class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
						class:border-primary={activeTab === 'background'}
						class:text-primary={activeTab === 'background'}
						class:border-transparent={activeTab !== 'background'}
						class:text-slate-600={activeTab !== 'background'}
						class:dark:text-slate-400={activeTab !== 'background'}
					>
						Background
					</button>
					<button
						type="button"
						on:click={() => (activeTab = 'adjustments')}
						class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
						class:border-primary={activeTab === 'adjustments'}
						class:text-primary={activeTab === 'adjustments'}
						class:border-transparent={activeTab !== 'adjustments'}
						class:text-slate-600={activeTab !== 'adjustments'}
						class:dark:text-slate-400={activeTab !== 'adjustments'}
					>
						Adjustments
					</button>
				</div>

				{#if activeTab === 'background'}
					<div class="space-y-6">
						<!-- Background Removal -->
						<div>
							<label class="flex items-center gap-3 cursor-pointer">
								<input
									type="checkbox"
									checked={removeBg}
									on:change={(e) => {
										removeBg = e.currentTarget.checked;
										handleRemoveBgChange();
									}}
									disabled={isProcessingBg}
									class="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 disabled:opacity-50 accent-primary"
								/>
								<span class="text-sm font-medium">
									Remove Background
									{#if isProcessingBg}
										<span class="text-xs text-muted-foreground ml-2">Processing...</span>
									{/if}
								</span>
							</label>
							<p class="text-xs text-muted-foreground mt-1 ml-7">
								AI-powered background removal. Fully processed on your device—no data is sent to any server.
							</p>
						</div>

						<!-- Background Color -->
						<div>
							<label for="background-color-group" class="block text-sm font-medium mb-2">Background Color</label>
							<div id="background-color-group" class="space-y-3">
								<label class="flex items-center gap-2 cursor-pointer" for="bg-transparent">
									<input
										id="bg-transparent"
										type="radio"
										checked={backgroundColor === null}
										on:change={() => {
											// Store current color before switching to transparent
											if (backgroundColor !== null) {
												previousBackgroundColor = backgroundColor;
											}
											backgroundColor = null;
											updatePreview();
										}}
										class="w-4 h-4 text-primary border-border focus:ring-primary accent-primary"
									/>
									<span class="text-sm">No background (transparent)</span>
								</label>
								<label class="flex items-center gap-2 cursor-pointer" for="bg-custom">
									<input
										id="bg-custom"
										type="radio"
										checked={backgroundColor !== null}
										on:change={() => {
											// Restore previous color or use default
											backgroundColor = previousBackgroundColor || '#ffffff';
											updatePreview();
										}}
										class="w-4 h-4 text-primary border-border focus:ring-primary accent-primary"
									/>
									<span class="text-sm">Custom color</span>
								</label>
								{#if backgroundColor !== null}
									<ColorPicker bind:value={backgroundColor} />
								{/if}
							</div>
						</div>
					</div>
				{:else}
					<div class="space-y-6">
						<!-- Brightness -->
						<div>
							<label for="brightness-slider" class="block text-sm font-medium mb-2">
								Brightness: {((brightness - 1) * 100).toFixed(0)}%
							</label>
							<input
								id="brightness-slider"
								type="range"
								min="0.5"
								max="2"
								step="0.1"
								bind:value={brightness}
								on:input={updatePreview}
								class="w-full accent-primary"
							/>
						</div>

						<!-- Contrast -->
						<div>
							<label for="contrast-slider" class="block text-sm font-medium mb-2">
								Contrast: {((contrast - 1) * 100).toFixed(0)}%
							</label>
							<input
								id="contrast-slider"
								type="range"
								min="0.5"
								max="2"
								step="0.1"
								bind:value={contrast}
								on:input={updatePreview}
								class="w-full accent-primary"
							/>
						</div>

						<!-- Exposure -->
						<div>
							<label for="exposure-slider" class="block text-sm font-medium mb-2">
								Exposure: {exposure > 0 ? '+' : ''}{exposure.toFixed(1)}
							</label>
							<input
								id="exposure-slider"
								type="range"
								min="-1"
								max="1"
								step="0.1"
								bind:value={exposure}
								on:input={updatePreview}
								class="w-full accent-primary"
							/>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
	
	<style>
		/* Use primary color for accent on form controls */
		:global(input[type="checkbox"].accent-primary),
		:global(input[type="radio"].accent-primary),
		:global(input[type="range"].accent-primary) {
			accent-color: hsl(var(--primary));
		}
	</style>
	
	<!-- Primary Action Bar -->
	<StepActionBar
		primaryAction={{
			label: 'Continue to Export',
			onClick: proceedToExport
		}}
		leftActions={leftActions}
	/>
</StepLayout>

