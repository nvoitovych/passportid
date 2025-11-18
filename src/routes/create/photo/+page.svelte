<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { selectedDocument } from '$lib/stores/documentStore';
	import { photoState } from '$lib/stores/photoStore';
	import Button from '$lib/components/Button.svelte';
	import StepLayout from '$lib/components/StepLayout.svelte';
	import StepActionBar from '$lib/components/StepActionBar.svelte';
	import { get } from 'svelte/store';

	const backIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>';
	const resetIcon = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>';

	function goBack() {
		goto('/create/select-document');
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

	let videoEl: HTMLVideoElement;
	let canvasEl: HTMLCanvasElement;
	let fileInput: HTMLInputElement;
	let stream: MediaStream | null = null;
	let facingMode: 'user' | 'environment' = 'user';
	let isCapturing = false;
	let isDragging = false;
	let previewUrl: string | null = null;
	let inputMode: 'camera' | 'upload' = 'camera';
let isCameraMode = true;

	const doc = get(selectedDocument);
	if (!doc && browser) {
		goto('/create/select-document');
	}

	let windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
	let windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
let maskScale = 1; // User-controlled scale multiplier (1.0 = default)
let maskPosition = { x: 0, y: 0 }; // Position offset for the mask
let isDraggingMask = false;
let maskDragStart = { x: 0, y: 0 };
let isScalingMask = false;
	let maskScaleStart = { distance: 0, scale: 1 };
	let videoAspect = 4 / 3; // Default to common camera aspect ratio (will update when video loads)
	let countdown = 0;
	let countdownInterval: ReturnType<typeof setInterval> | null = null;
	
	// Reactive secondary actions for action bar
	$: secondaryActions = [
		{
			label: 'Switch Camera',
			onClick: switchCamera,
			variant: 'secondary' as 'secondary'
		},
		{
			label: countdown > 0 ? `Cancel Timer (${countdown})` : 'Timer Capture (3s)',
			onClick: () => (countdown > 0 ? cancelTimerCapture() : startTimerCapture(3)),
			variant: (countdown > 0 ? 'destructive' : 'outline') as 'destructive' | 'outline'
		}
	];
	
const MIN_MASK_SCALE = 0.3;
const MAX_MASK_SCALE = 1.0; // Limited to camera size
const MIN_CAMERA_HEIGHT = 320;
const MAX_CAMERA_HEIGHT = 640;
const DEFAULT_CAMERA_WIDTH = 640;

// Track mode for styling
$: isCameraMode = inputMode === 'camera';

// Calculate max scale based on camera/video size - frame should match camera size
$: videoContainer = videoEl?.parentElement;
$: desiredCameraHeight = Math.min(windowHeight * 0.5, MAX_CAMERA_HEIGHT);
$: cameraHeight = Math.max(MIN_CAMERA_HEIGHT, desiredCameraHeight);
$: safeViewportWidth = windowWidth || 1024;
$: cameraWidth = cameraHeight * videoAspect;
$: cameraWidthClamped = Math.max(240, Math.min(cameraWidth, safeViewportWidth));
$: cameraRenderWidth = Math.max(240, Math.min(cameraWidthClamped, safeViewportWidth - 32));

// Use container dimensions (which match the visible camera area)
$: cameraContainerWidth = cameraRenderWidth > 0 ? cameraRenderWidth : DEFAULT_CAMERA_WIDTH;
$: baseFrameScale = cameraContainerWidth > 0 && cameraHeight > 0 && doc ? Math.min(
	cameraContainerWidth / doc.requirements.width,
	cameraHeight / doc.requirements.height
) : 0.3;
	
	// Apply user-controlled scale (limited by camera size)
	$: effectiveMaxScale = MAX_MASK_SCALE;
	$: frameScale = baseFrameScale * maskScale;
	$: frameWidth = doc ? doc.requirements.width * frameScale : 0;
	$: frameHeight = doc ? doc.requirements.height * frameScale : 0;
	$: headTop = doc?.requirements.headPosition?.top;
	$: headBottom = doc?.requirements.headPosition?.bottom;
	$: minHeadSize = doc?.requirements.minHeadSize ?? doc?.requirements.headHeightPerc?.[0];
	$: headHeightPerc = doc?.requirements.headHeightPerc;
	$: eyeLineMM = doc?.requirements.headPosition?.eyeLineMM;
	$: hasHeadPosition = doc?.requirements.headPosition && typeof headTop === 'number' && typeof headBottom === 'number';

	function handleResize() {
		if (typeof window !== 'undefined') {
			windowWidth = window.innerWidth;
			windowHeight = window.innerHeight;
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
			
			// Constrain to camera bounds
			if (videoContainer) {
				const maxX = (videoContainer.clientWidth - frameWidth) / 2;
				const maxY = (videoContainer.clientHeight - frameHeight) / 2;
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

function clearCountdown() {
	if (countdownInterval) {
		clearInterval(countdownInterval);
		countdownInterval = null;
	}
	countdown = 0;
}

function startTimerCapture(duration = 3) {
	if (countdown > 0 || isCapturing || !doc) return;
	countdown = duration;
	countdownInterval = setInterval(() => {
		countdown -= 1;
		if (countdown <= 0) {
			clearCountdown();
			capturePhoto();
		}
	}, 1000);
}

function cancelTimerCapture() {
	clearCountdown();
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
				videoEl.onloadedmetadata = () => {
					const width = videoEl.videoWidth;
					const height = videoEl.videoHeight;
					if (width > 0 && height > 0) {
						videoAspect = width / height;
					}
				};
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
	clearCountdown();

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

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	}

	function handleFileInput(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			handleFile(target.files[0]);
		}
	}

	function handleFile(file: File) {
		if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
			alert('Please upload a PNG or JPEG image');
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result as string;
			previewUrl = result;

			const img = new Image();
			img.src = result;
			img.onload = () => {
				photoState.update((state) => ({
					...state,
					originalImage: img
				}));
				goto('/create/align');
			};
		};
		reader.readAsDataURL(file);
	}

	function switchMode(mode: 'camera' | 'upload') {
		inputMode = mode;
		if (mode === 'camera') {
			previewUrl = null;
			startCamera();
		} else {
			stopCamera();
		}
	}

	onMount(() => {
		if (inputMode === 'camera') {
			startCamera();
		}
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', handleResize);
			handleResize();
		}
	});

	onDestroy(() => {
		stopCamera();
	clearCountdown();
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('mousemove', handleCornerMouseMove);
			window.removeEventListener('mouseup', handleCornerMouseUp);
		}
	});
</script>

<svelte:head>
	<title>Take/Upload Photo - PassportID</title>
</svelte:head>

<StepLayout currentStep={2} title="Upload or Take Photo">
	<div class="pb-24">
	{#if doc}
		{#if inputMode === 'camera'}
			<!-- Camera Mode -->
			<div class="space-y-6">
				<!-- Camera/Upload Toggle - Moved before camera container -->
				<div class="flex justify-center">
					<div class="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-1">
						<button
							type="button"
							on:click={() => switchMode('camera')}
							class="px-4 py-2 text-sm font-medium rounded-md transition-all"
							class:bg-primary={isCameraMode}
							class:text-white={isCameraMode}
							class:text-slate-700={!isCameraMode}
							class:dark:text-slate-300={!isCameraMode}
						>
							Camera
						</button>
						<button
							type="button"
							on:click={() => switchMode('upload')}
							class="px-4 py-2 text-sm font-medium rounded-md transition-all"
							class:bg-primary={!isCameraMode}
							class:text-white={!isCameraMode}
							class:text-slate-700={isCameraMode}
							class:dark:text-slate-300={isCameraMode}
						>
							Upload
						</button>
					</div>
				</div>
				
				<div
					class="relative bg-slate-900 rounded-lg overflow-hidden mx-auto"
					style={`height: ${cameraHeight}px; width: ${cameraContainerWidth}px; max-width: 100%;`}
				>
					<!-- svelte-ignore a11y-media-has-caption -->
					<video
						bind:this={videoEl}
						autoplay
						playsinline
						muted
						aria-hidden="true"
						class="absolute inset-0 w-full h-full object-contain bg-black"
						style="transform: scaleX(-1);"
					></video>
					<canvas bind:this={canvasEl} class="hidden"></canvas>

					<!-- Document frame overlay with mask -->
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
					<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
					<div 
						class="absolute inset-0 flex items-center justify-center {isDraggingMask ? 'cursor-grabbing' : isScalingMask ? 'cursor-nwse-resize' : 'cursor-grab'}"
						on:mousedown={handleMaskMouseDown}
						on:mousemove={handleMaskMouseMove}
						on:mouseup={handleMaskMouseUp}
						on:mouseleave={handleMaskMouseUp}
						role="application"
						tabindex="-1"
						aria-label="Camera frame - drag to move, drag corner to resize"
					>
						{#if countdown > 0}
							<div class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
								<div class="text-7xl md:text-8xl font-bold text-white drop-shadow-2xl">
									{countdown}
								</div>
							</div>
						{/if}

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
					<p class="text-xs text-muted-foreground/70 italic">
						You can adjust and crop the photo in the next step
					</p>
				</div>
			</div>
		{:else}
			<!-- Upload Mode -->
			<div class="w-full flex flex-col items-center gap-4">
				<!-- Camera/Upload Toggle - Moved before upload container -->
				<div class="flex justify-center w-full">
					<div class="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-1">
						<button
							type="button"
							on:click={() => switchMode('camera')}
							class="px-4 py-2 text-sm font-medium rounded-md transition-all"
							class:bg-primary={isCameraMode}
							class:text-white={isCameraMode}
							class:text-slate-700={!isCameraMode}
							class:dark:text-slate-300={!isCameraMode}
						>
							Camera
						</button>
						<button
							type="button"
							on:click={() => switchMode('upload')}
							class="px-4 py-2 text-sm font-medium rounded-md transition-all"
							class:bg-primary={!isCameraMode}
							class:text-white={!isCameraMode}
							class:text-slate-700={isCameraMode}
							class:dark:text-slate-300={isCameraMode}
						>
							Upload
						</button>
					</div>
				</div>
				
				<div
					class="border-2 border-dashed rounded-lg p-12 text-center transition-colors {isDragging
						? 'border-primary bg-primary/5'
						: 'border-border'} w-full"
					style={`max-width: ${cameraContainerWidth}px; min-height: ${cameraHeight}px;`}
					on:dragover={handleDragOver}
					on:dragleave={handleDragLeave}
					on:drop={handleDrop}
					role="button"
					tabindex="0"
					aria-label="Upload photo"
				>
					{#if previewUrl}
						<div class="space-y-4">
							<img src={previewUrl} alt="Preview" class="max-w-full max-h-96 mx-auto mb-6 rounded-lg" />
							<p class="text-sm text-muted-foreground">Photo loaded. Proceeding to alignment...</p>
						</div>
					{:else}
						<div class="space-y-4">
							<svg class="w-16 h-16 mx-auto text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
							</svg>
							<p class="text-lg font-medium">Drag and drop your photo here</p>
							<p class="text-sm text-muted-foreground">
								or click to browse (PNG, JPEG)
							</p>
							<input
								bind:this={fileInput}
								type="file"
								accept="image/png,image/jpeg"
								on:change={handleFileInput}
								class="hidden"
							/>
							<Button on:click={() => fileInput?.click()}>Choose File</Button>
						</div>
					{/if}
				</div>
			<div
				class="text-center space-y-1.5 min-h-[88px] w-full flex flex-col justify-center mx-auto mt-3"
				style={`width: ${cameraContainerWidth}px; max-width: 100%;`}
			>
					<p class="text-sm text-muted-foreground">
						Upload a photo and we’ll guide you through alignment and editing.
					</p>
					<p class="text-xs text-muted-foreground/70 italic">
						You can still crop, adjust, and export in the next steps.
				</p>
				<p class="text-xs text-muted-foreground/70 italic opacity-0 select-none">
					Placeholder
				</p>
				</div>
			</div>
		{/if}
	{/if}
	</div>
	
	<!-- Primary Action Bar -->
	{#if doc && inputMode === 'camera'}
		<StepActionBar
			primaryAction={{
				label: isCapturing ? 'Capturing...' : 'Capture Photo',
				onClick: capturePhoto,
				disabled: isCapturing
			}}
			secondaryActions={secondaryActions}
			leftActions={leftActions}
		/>
	{/if}
</StepLayout>

