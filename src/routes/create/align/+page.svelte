<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { selectedDocument } from '$lib/stores/documentStore';
	import { photoState } from '$lib/stores/photoStore';
	import { cropImageToDocument } from '$lib/canvas/imageProcessing';
	import StepLayout from '$lib/components/StepLayout.svelte';
	import StepActionBar from '$lib/components/StepActionBar.svelte';
	import { get } from 'svelte/store';

	const backIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>';
	const resetIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>';

	function goBack() {
		goto('/create/photo');
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

	let imageEl: HTMLImageElement;
	let interactionLayer: HTMLDivElement;
	let canvasEl: HTMLCanvasElement;
	let isDraggingMask = false;
	let maskDragStart = { x: 0, y: 0 };
	let isScalingMask = false;
	let maskScaleStart = { distance: 0, scale: 1 };
	let maskScale = 1; // User-controlled scale multiplier (1.0 = default)
	let maskPosition = { x: 0, y: 0 }; // Position offset for the mask
	let imageAspect = 3 / 4;
	let imageLoaded = false;
	let displayedImageWidth = 0;
	let displayedImageHeight = 0;

	const doc = get(selectedDocument);
	const photo = get(photoState);

	if (browser && (!doc || !photo.originalImage)) {
		goto('/create/select-document');
	}

	let windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
	let windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

	const MIN_MASK_SCALE = 0.3;
	const MAX_MASK_SCALE = 3.0; // Allow frame to be up to 3x the base scale
	const MIN_CAMERA_HEIGHT = 320;
	const MAX_CAMERA_HEIGHT = 640;
	const DEFAULT_CAMERA_WIDTH = 640;
	const MIN_ALIGNMENT_PADDING = 24;
	const MAX_ALIGNMENT_PADDING = 64;

	// Calculate canvas dimensions same as photo page
	$: imageContainer = interactionLayer;
	$: desiredCameraHeight = Math.min(windowHeight * 0.5, MAX_CAMERA_HEIGHT);
	$: cameraHeight = Math.max(MIN_CAMERA_HEIGHT, desiredCameraHeight);
	$: safeViewportWidth = windowWidth || 1024;
	$: cameraWidth = cameraHeight * imageAspect;
	$: cameraWidthClamped = Math.max(240, Math.min(cameraWidth, safeViewportWidth));
	$: cameraRenderWidth = Math.max(240, Math.min(cameraWidthClamped, safeViewportWidth - 32));
	$: cameraContainerWidth = cameraRenderWidth > 0 ? cameraRenderWidth : DEFAULT_CAMERA_WIDTH;

	// Calculate frame size: typical crop problem
	// Frame width OR height should equal photo width OR height (whichever is reached first)
	// while maintaining document aspect ratio
	$: photoAspect = displayedImageWidth > 0 && displayedImageHeight > 0 ? displayedImageWidth / displayedImageHeight : 0;
	$: docAspect = doc ? doc.requirements.width / doc.requirements.height : 0;
	
	// Determine which dimension limits: compare aspect ratios
	// If photo is wider (photoAspect > docAspect), height limits; otherwise width limits
	$: widthScale = displayedImageWidth > 0 && doc ? displayedImageWidth / doc.requirements.width : 0;
	$: heightScale = displayedImageHeight > 0 && doc ? displayedImageHeight / doc.requirements.height : 0;
	
	// baseFrameScale is the scale where frame fits exactly in photo
	// When maskScale = 1.0: frameWidth = photoWidth OR frameHeight = photoHeight
	$: baseFrameScale = Math.min(widthScale, heightScale);
	
	// Apply user scale multiplier
	$: frameScale = baseFrameScale > 0 ? baseFrameScale * maskScale : 0;
	
	// Calculate frame dimensions maintaining document aspect ratio
	$: frameWidth = doc && frameScale > 0 ? doc.requirements.width * frameScale : 0;
	$: frameHeight = doc && frameScale > 0 ? doc.requirements.height * frameScale : 0;
	
	// When maskScale = 1.0:
	// - If widthScale < heightScale: frameWidth = photoWidth, frameHeight < photoHeight
	// - If heightScale < widthScale: frameHeight = photoHeight, frameWidth < photoWidth
	
	$: effectiveMaxScale = MAX_MASK_SCALE;
	$: headTop = doc?.requirements.headPosition?.top;
	$: headBottom = doc?.requirements.headPosition?.bottom;
	$: minHeadSize = doc?.requirements.minHeadSize;
	$: headHeightPerc = doc?.requirements.headHeightPerc;
	$: eyeLineMM = doc?.requirements.headPosition?.eyeLineMM;
	$: hasHeadPosition = doc?.requirements.headPosition && typeof headTop === 'number' && typeof headBottom === 'number';
	$: alignmentPadding = cameraContainerWidth
		? Math.min(
				MAX_ALIGNMENT_PADDING,
				Math.max(MIN_ALIGNMENT_PADDING, cameraContainerWidth * 0.05)
		  )
		: MIN_ALIGNMENT_PADDING;

	function handleResize() {
		if (typeof window !== 'undefined') {
			windowWidth = window.innerWidth;
			windowHeight = window.innerHeight;
		}
		// Update displayed image dimensions after resize
		if (imageEl && imageLoaded) {
			displayedImageWidth = imageEl.width || 0;
			displayedImageHeight = imageEl.height || 0;
		}
	}

	function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
		return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
	}

	function handleMaskMouseDown(e: MouseEvent) {
		if (e.button !== 0) return; // Only left mouse button

		// Check if clicking on corner for scaling
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;
		const frameRect = {
			left: rect.width / 2 - frameWidth / 2 + maskPosition.x,
			right: rect.width / 2 + frameWidth / 2 + maskPosition.x,
			top: rect.height / 2 - frameHeight / 2 + maskPosition.y,
			bottom: rect.height / 2 + frameHeight / 2 + maskPosition.y
		};

		const cornerSize = 20;
		const isNearCorner =
			(clickX >= frameRect.right - cornerSize && clickX <= frameRect.right + cornerSize &&
				clickY >= frameRect.bottom - cornerSize && clickY <= frameRect.bottom + cornerSize) ||
			(clickX >= frameRect.left - cornerSize && clickX <= frameRect.left + cornerSize &&
				clickY >= frameRect.top - cornerSize && clickY <= frameRect.top + cornerSize);

		if (isNearCorner) {
			isScalingMask = true;
			maskScaleStart.distance = getDistance({ x: clickX, y: clickY }, { x: rect.width / 2, y: rect.height / 2 });
			maskScaleStart.scale = maskScale;
		} else {
			isDraggingMask = true;
			maskDragStart.x = e.clientX - maskPosition.x;
			maskDragStart.y = e.clientY - maskPosition.y;
		}

		e.preventDefault();
	}

	function handleMaskMouseMove(e: MouseEvent) {
		if (isDraggingMask) {
			maskPosition.x = e.clientX - maskDragStart.x;
			maskPosition.y = e.clientY - maskDragStart.y;

			// Constrain to actual image bounds, not container
			if (imageContainer && imageEl && displayedImageWidth > 0 && displayedImageHeight > 0) {
				// Get image position within container (object-contain centers it)
				const imageOffsetX = (imageContainer.clientWidth - displayedImageWidth) / 2;
				const imageOffsetY = (imageContainer.clientHeight - displayedImageHeight) / 2;
				
				// Calculate max offset relative to image center
				const maxX = (displayedImageWidth - frameWidth) / 2;
				const maxY = (displayedImageHeight - frameHeight) / 2;
				
				// Constrain mask position to keep frame within image bounds
				maskPosition.x = Math.max(-maxX, Math.min(maxX, maskPosition.x));
				maskPosition.y = Math.max(-maxY, Math.min(maxY, maskPosition.y));
			} else if (imageContainer) {
				// Fallback to container bounds if image not loaded
				const maxX = (imageContainer.clientWidth - frameWidth) / 2;
				const maxY = (imageContainer.clientHeight - frameHeight) / 2;
				maskPosition.x = Math.max(-maxX, Math.min(maxX, maskPosition.x));
				maskPosition.y = Math.max(-maxY, Math.min(maxY, maskPosition.y));
			}
		} else if (isScalingMask) {
			const overlayDiv = (e.currentTarget as HTMLElement);
			const overlayRect = overlayDiv.getBoundingClientRect();
			const centerX = overlayRect.left + overlayRect.width / 2;
			const centerY = overlayRect.top + overlayRect.height / 2;
			const currentDistance = getDistance({ x: e.clientX, y: e.clientY }, { x: centerX, y: centerY });

			if (maskScaleStart.distance > 0) {
				const scaleDelta = currentDistance / maskScaleStart.distance;
				maskScale = Math.max(MIN_MASK_SCALE, Math.min(effectiveMaxScale, maskScaleStart.scale * scaleDelta));
			}
		}
	}

	function handleMaskMouseUp() {
		isDraggingMask = false;
		isScalingMask = false;
	}

	function zoomMaskIn() {
		maskScale = Math.min(effectiveMaxScale, maskScale * 1.1);
	}

	function zoomMaskOut() {
		maskScale = Math.max(MIN_MASK_SCALE, maskScale * 0.9);
	}

	function resetMaskScale() {
		maskScale = 1;
		maskPosition = { x: 0, y: 0 };
	}

	function handleCornerMouseDown(e: MouseEvent, corner: 'tl' | 'tr' | 'bl' | 'br') {
		if (e.button === 0) {
			isScalingMask = true;
			// Get the frame element's center position
			const overlayDiv = (e.currentTarget as HTMLElement).closest('[role="application"]') as HTMLElement;
			if (overlayDiv) {
				const overlayRect = overlayDiv.getBoundingClientRect();
				const centerX = overlayRect.left + overlayRect.width / 2;
				const centerY = overlayRect.top + overlayRect.height / 2;
				maskScaleStart.distance = getDistance({ x: e.clientX, y: e.clientY }, { x: centerX, y: centerY });
				maskScaleStart.scale = maskScale;
			}
			e.preventDefault();
			e.stopPropagation();

			// Add global mouse handlers for corner dragging
			if (typeof window !== 'undefined') {
				window.addEventListener('mousemove', handleCornerMouseMove);
				window.addEventListener('mouseup', handleCornerMouseUp);
			}
		}
	}

	function handleCornerMouseMove(e: MouseEvent) {
		if (isScalingMask) {
			const overlayDiv = document.querySelector('[role="application"]') as HTMLElement;
			if (overlayDiv) {
				const overlayRect = overlayDiv.getBoundingClientRect();
				const centerX = overlayRect.left + overlayRect.width / 2;
				const centerY = overlayRect.top + overlayRect.height / 2;
				const currentDistance = getDistance({ x: e.clientX, y: e.clientY }, { x: centerX, y: centerY });

				if (maskScaleStart.distance > 0) {
					const scaleDelta = currentDistance / maskScaleStart.distance;
					maskScale = Math.max(MIN_MASK_SCALE, Math.min(effectiveMaxScale, maskScaleStart.scale * scaleDelta));
				}
			}
		}
	}

	function handleCornerMouseUp() {
		if (isScalingMask) {
			isScalingMask = false;
			if (typeof window !== 'undefined') {
				window.removeEventListener('mousemove', handleCornerMouseMove);
				window.removeEventListener('mouseup', handleCornerMouseUp);
			}
		}
	}

	async function confirmAlignment() {
		if (!doc || !photo.originalImage || !imageEl || !imageContainer) return;

		const img = new Image();
		img.src = imageEl.src;

		await new Promise((resolve) => {
			img.onload = resolve;
		});

		// Get the displayed image dimensions
		const displayedWidth = imageEl.width;
		const displayedHeight = imageEl.height;
		const naturalWidth = imageEl.naturalWidth;
		const naturalHeight = imageEl.naturalHeight;

		// Calculate scale factors from displayed to natural size
		const scaleX = naturalWidth / displayedWidth;
		const scaleY = naturalHeight / displayedHeight;

		// Frame center in displayed coordinates (relative to container center)
		const containerCenterX = imageContainer.clientWidth / 2;
		const containerCenterY = imageContainer.clientHeight / 2;
		const frameCenterX = containerCenterX + maskPosition.x;
		const frameCenterY = containerCenterY + maskPosition.y;

		// Get image position within container (object-contain centers it)
		const imageOffsetX = (imageContainer.clientWidth - displayedWidth) / 2;
		const imageOffsetY = (imageContainer.clientHeight - displayedHeight) / 2;

		// Convert frame center to image coordinates (relative to image top-left)
		const imageRelativeX = frameCenterX - imageOffsetX;
		const imageRelativeY = frameCenterY - imageOffsetY;

		// Convert to natural image coordinates
		const naturalX = imageRelativeX * scaleX;
		const naturalY = imageRelativeY * scaleY;

		// Calculate frame size in natural image coordinates
		// Frame size should be calculated relative to the actual image, not the container
		// We need to calculate the frame scale based on the displayed image size
		const imageFrameScale = Math.min(
			displayedWidth / doc.requirements.width,
			displayedHeight / doc.requirements.height
		) * maskScale;
		
		const frameNaturalWidth = doc.requirements.width * imageFrameScale * scaleX;
		const frameNaturalHeight = doc.requirements.height * imageFrameScale * scaleY;

		// Crop to document size
		const croppedCanvas = cropImageToDocument(
			img,
			doc,
			naturalX,
			naturalY,
			frameNaturalWidth,
			frameNaturalHeight
		);

		photoState.update((state) => ({
			...state,
			alignedImage: croppedCanvas,
			canvas: croppedCanvas
		}));

		goto('/create/edit');
	}

	function handleImageLoad() {
		if (imageEl) {
			const width = imageEl.naturalWidth;
			const height = imageEl.naturalHeight;
			if (width > 0 && height > 0) {
				imageAspect = width / height;
				imageLoaded = true;
			}
			
			// Use requestAnimationFrame to ensure image is fully rendered before getting dimensions
			requestAnimationFrame(() => {
				if (imageEl) {
					// Update displayed image dimensions
					displayedImageWidth = imageEl.width || 0;
					displayedImageHeight = imageEl.height || 0;
					
					// Reset mask scale to 1.0 to ensure frame starts at maximum size
					// When maskScale = 1.0: frameWidth = photoWidth OR frameHeight = photoHeight
					if (displayedImageWidth > 0 && displayedImageHeight > 0) {
						maskScale = 1.0;
						maskPosition = { x: 0, y: 0 };
					}
				}
			});
		}
	}
	
	// Update displayed image dimensions reactively when image element or container size changes
	$: if (imageEl && imageLoaded) {
		const newWidth = imageEl.width || 0;
		const newHeight = imageEl.height || 0;
		
		// Only update if dimensions actually changed to avoid unnecessary resets
		if (newWidth !== displayedImageWidth || newHeight !== displayedImageHeight) {
			displayedImageWidth = newWidth;
			displayedImageHeight = newHeight;
			
			// Reset mask scale to 1.0 when image dimensions change
			// This ensures frame is always at maximum size when image is loaded/resized
			if (newWidth > 0 && newHeight > 0) {
				maskScale = 1.0;
			}
		}
	}

	onMount(() => {
		if (photo.originalImage && imageEl) {
			if (photo.originalImage instanceof Image) {
				imageEl.src = photo.originalImage.src;
			} else {
				// Handle ImageBitmap
				const canvas = document.createElement('canvas');
				canvas.width = photo.originalImage.width;
				canvas.height = photo.originalImage.height;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.drawImage(photo.originalImage, 0, 0);
					imageEl.src = canvas.toDataURL();
				}
			}
		}
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', handleResize);
			handleResize();
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('mousemove', handleCornerMouseMove);
			window.removeEventListener('mouseup', handleCornerMouseUp);
		}
	});
</script>

<svelte:head>
	<title>Align & Crop Photo - PassportID</title>
</svelte:head>

<StepLayout currentStep={3} title="Align & Crop to Fit Requirements">
	{#if doc}
		<div class="grid lg:grid-cols-3 gap-8 pb-24">
			<!-- Preview Area -->
			<div class="lg:col-span-2">
				<div class="space-y-6">
					<div
						class="relative bg-slate-900 rounded-lg overflow-hidden mx-auto"
						style={`height: ${cameraHeight}px; width: ${cameraContainerWidth}px; max-width: 100%;`}
					>
						<!-- Image -->
						<div class="absolute inset-0 flex items-center justify-center">
							<img
								bind:this={imageEl}
								on:load={handleImageLoad}
								class="object-contain bg-black rounded"
								style={`max-width: calc(100% - ${alignmentPadding * 2}px); max-height: calc(100% - ${
									alignmentPadding * 2
								}px);`}
								alt="Alignment preview"
								draggable="false"
							/>
						</div>
						<canvas bind:this={canvasEl} class="hidden"></canvas>

						<!-- Document frame overlay with mask -->
						<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
						<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
						<div
							bind:this={interactionLayer}
							class="absolute inset-0 flex items-center justify-center {isDraggingMask ? 'cursor-grabbing' : isScalingMask ? 'cursor-nwse-resize' : 'cursor-grab'}"
							on:mousedown={handleMaskMouseDown}
							on:mousemove={handleMaskMouseMove}
							on:mouseup={handleMaskMouseUp}
							on:mouseleave={handleMaskMouseUp}
							role="application"
							tabindex="-1"
							aria-label="Photo frame - drag to move, drag corner to resize"
						>
							<!-- Mask overlay - darken area outside frame -->
							<div class="absolute inset-0 bg-black/35"></div>

							<!-- Document frame -->
							<div
								class="relative border-2 border-primary border-dashed pointer-events-none"
								style="width: {frameWidth}px; height: {frameHeight}px; aspect-ratio: {doc.requirements.width} / {doc.requirements.height}; transform: translate({maskPosition.x}px, {maskPosition.y}px);"
							>
								<!-- Clear area inside frame -->
								<div class="absolute inset-0 bg-transparent"></div>

								<!-- Head position guidelines -->
								{#if hasHeadPosition && headTop !== undefined && headBottom !== undefined}
									<!-- Head area highlight (subtle background) -->
									<div
										class="absolute left-0 right-0 bg-primary/5 border-y border-primary/20"
										style="top: {headTop}%; height: {headBottom - headTop}%;"
									></div>

									<!-- Top head line -->
									<div
										class="absolute left-0 right-0 border-t-2 border-primary/70 border-dashed z-10"
										style="top: {headTop}%;"
									>
										<div class="absolute -left-20 top-1/2 -translate-y-1/2 text-xs text-primary font-medium whitespace-nowrap bg-background/80 px-1 rounded">
											Head start
										</div>
									</div>

									<!-- Bottom head line -->
									<div
										class="absolute left-0 right-0 border-t-2 border-primary/70 border-dashed z-10"
										style="top: {headBottom}%;"
									>
										<div class="absolute -left-20 top-1/2 -translate-y-1/2 text-xs text-primary font-medium whitespace-nowrap bg-background/80 px-1 rounded">
											Head end
										</div>
									</div>

									<!-- Head size indicator (vertical line showing head height range) -->
									{#if hasHeadPosition && headTop !== undefined && headBottom !== undefined}
										{@const headHeight = headBottom - headTop}
										<div
											class="absolute left-1/2 -translate-x-1/2 border-l-2 border-primary/50 border-dashed z-10"
											style="top: {headTop}%; height: {headHeight}%;"
										>
											<div class="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-primary/80 font-medium whitespace-nowrap bg-background/80 px-1 rounded">
												{#if headHeightPerc}
													{headHeightPerc[0]}-{headHeightPerc[1]}%
												{:else if minHeadSize}
													{minHeadSize}% min
												{:else}
													Head area
												{/if}
											</div>
										</div>
									{/if}

									<!-- Eye line guideline (if specified) -->
									{#if eyeLineMM && doc}
										<!-- Calculate eye line position from bottom in percentage -->
										<!-- Convert MM to percentage: height in MM = (height in px / dpi) * 25.4 -->
										{@const heightInInches = doc.requirements.height / doc.requirements.dpi}
										{@const heightInMM = heightInInches * 25.4}
										{@const eyeLinePercMin = (eyeLineMM[0] / heightInMM) * 100}
										{@const eyeLinePercMax = (eyeLineMM[1] / heightInMM) * 100}
										
										<!-- Display two lines if min and max are different -->
										{#if eyeLineMM[0] !== eyeLineMM[1]}
											<!-- Min eye line (closer to bottom) -->
											<div
												class="absolute left-0 right-0 border-t-2 border-primary/70 border-dashed z-10"
												style="bottom: {eyeLinePercMin}%;"
											>
												<div class="absolute -left-20 top-1/2 -translate-y-1/2 text-xs text-primary font-medium whitespace-nowrap bg-background/80 px-1 rounded">
													Eye line min ({eyeLineMM[0]}mm)
												</div>
											</div>
											<!-- Max eye line (further from bottom) -->
											<div
												class="absolute left-0 right-0 border-t-2 border-primary/70 border-dashed z-10"
												style="bottom: {eyeLinePercMax}%;"
											>
												<div class="absolute -left-20 top-1/2 -translate-y-1/2 text-xs text-primary font-medium whitespace-nowrap bg-background/80 px-1 rounded">
													Eye line max ({eyeLineMM[1]}mm)
												</div>
											</div>
										{:else}
											<!-- Single line if min and max are the same -->
											<div
												class="absolute left-0 right-0 border-t-2 border-primary/70 border-dashed z-10"
												style="bottom: {eyeLinePercMin}%;"
											>
												<div class="absolute -left-20 top-1/2 -translate-y-1/2 text-xs text-primary font-medium whitespace-nowrap bg-background/80 px-1 rounded">
													Eye line ({eyeLineMM[0]}mm)
												</div>
											</div>
										{/if}
									{/if}
								{/if}

								<!-- Corner indicators (larger for easier scaling) -->
								<div
									class="absolute -top-2 -left-2 w-6 h-6 border-2 border-primary bg-primary/20 rounded-sm pointer-events-auto cursor-nwse-resize"
									on:mousedown={(e) => handleCornerMouseDown(e, 'tl')}
									role="button"
									tabindex="0"
									aria-label="Resize frame from top left"
									title="Drag to resize"
								></div>
								<div
									class="absolute -top-2 -right-2 w-6 h-6 border-2 border-primary bg-primary/20 rounded-sm pointer-events-auto cursor-nesw-resize"
									on:mousedown={(e) => handleCornerMouseDown(e, 'tr')}
									role="button"
									tabindex="0"
									aria-label="Resize frame from top right"
									title="Drag to resize"
								></div>
								<div
									class="absolute -bottom-2 -left-2 w-6 h-6 border-2 border-primary bg-primary/20 rounded-sm pointer-events-auto cursor-nesw-resize"
									on:mousedown={(e) => handleCornerMouseDown(e, 'bl')}
									role="button"
									tabindex="0"
									aria-label="Resize frame from bottom left"
									title="Drag to resize"
								></div>
								<div
									class="absolute -bottom-2 -right-2 w-6 h-6 border-2 border-primary bg-primary/20 rounded-sm pointer-events-auto cursor-nwse-resize"
									on:mousedown={(e) => handleCornerMouseDown(e, 'br')}
									role="button"
									tabindex="0"
									aria-label="Resize frame from bottom right"
									title="Drag to resize"
								></div>
							</div>

							<!-- Zoom controls -->
							<div class="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto">
								{#if maskScale !== 1 || maskPosition.x !== 0 || maskPosition.y !== 0}
									<button
										type="button"
										on:click={resetMaskScale}
										class="w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm border border-primary hover:bg-primary/30 transition-all flex items-center justify-center shadow-lg"
										aria-label="Reset mask scale and position"
										title="Reset to default size and position"
									>
										<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
										</svg>
									</button>
								{/if}
								<button
									type="button"
									on:click={zoomMaskIn}
									class="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border hover:border-primary hover:bg-background transition-all flex items-center justify-center shadow-lg"
									aria-label="Zoom in mask"
									title="Zoom in"
								>
									<svg class="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
								</button>
								<button
									type="button"
									on:click={zoomMaskOut}
									class="w-10 h-10 rounded-full bg-background/90 backdrop-blur-sm border border-border hover:border-primary hover:bg-background transition-all flex items-center justify-center shadow-lg"
									aria-label="Zoom out mask"
									title="Zoom out"
								>
									<svg class="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
									</svg>
								</button>
							</div>

							<!-- Scale indicator -->
							{#if maskScale !== 1}
								<div class="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm border border-border text-xs font-medium text-foreground pointer-events-auto">
									{Math.round(maskScale * 100)}%
								</div>
							{/if}
						</div>
					</div>

					<!-- Instructions -->
					<div
						class="text-center space-y-1.5 min-h-[88px] flex flex-col justify-center mx-auto mt-3"
						style={`max-width: ${cameraContainerWidth}px;`}
					>
						<p class="text-sm text-muted-foreground">
							Drag to move frame • Drag corner to resize • Use buttons to zoom
						</p>
						{#if hasHeadPosition}
							<p class="text-xs text-muted-foreground">
								Your head should be between the guide lines
								{#if headHeightPerc}
									({headHeightPerc[0]}-{headHeightPerc[1]}% of photo height)
								{:else if minHeadSize}
									({minHeadSize}% min)
								{/if}
							</p>
						{/if}
						{#if eyeLineMM}
							<p class="text-xs text-muted-foreground">
								Eye line should be {eyeLineMM[0]}-{eyeLineMM[1]}mm from bottom
							</p>
						{/if}
					</div>
				</div>
			</div>
			<!-- Requirements Sidebar -->
			<div class="lg:col-span-1">
				<div class="sticky top-8">
					<div class="bg-card border border-border rounded-lg p-6">
						<h2 class="text-lg font-semibold mb-4">Document Requirements</h2>
						<div class="space-y-3 text-sm">
							<div>
								<p class="text-muted-foreground mb-1">Size</p>
								<p class="font-medium">
									{doc.requirements.width} × {doc.requirements.height}px
								</p>
							</div>
							<div>
								<p class="text-muted-foreground mb-1">DPI</p>
								<p class="font-medium">{doc.requirements.dpi}</p>
							</div>
							<div>
								<p class="text-muted-foreground mb-1">Background</p>
								<p class="font-medium capitalize">{doc.requirements.background}</p>
							</div>
							{#if doc.requirements.minHeadSize}
								<div>
									<p class="text-muted-foreground mb-1">Min Head Size</p>
									<p class="font-medium">{doc.requirements.minHeadSize}%</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
	
	<!-- Primary Action Bar -->
	{#if doc}
		<StepActionBar
			primaryAction={{
				label: 'Confirm Alignment',
				onClick: confirmAlignment
			}}
			leftActions={leftActions}
		/>
	{/if}
</StepLayout>
