<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { selectedDocument } from '$lib/stores/documentStore';
	import { photoState } from '$lib/stores/photoStore';
	import Button from '$lib/components/Button.svelte';
	import { get } from 'svelte/store';

	let fileInput: HTMLInputElement;
	let isDragging = false;
	let previewUrl: string | null = null;

	const doc = get(selectedDocument);
	if (browser && !doc) {
		goto('/create/select-document');
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
			};
		};
		reader.readAsDataURL(file);
	}

	function proceedToAlign() {
		if (previewUrl) {
			goto('/create/align');
		}
	}
</script>

<svelte:head>
	<title>Upload Photo - PassportID</title>
</svelte:head>

<div class="container py-12">
	<h1 class="text-3xl font-bold mb-8">Upload Photo</h1>

	<div
		class="border-2 border-dashed rounded-lg p-12 text-center transition-colors"
		class:border-accent-500={isDragging}
		class:border-slate-300={!isDragging}
		class:dark:border-slate-600={!isDragging}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
		role="button"
		tabindex="0"
		aria-label="Upload photo by dragging and dropping or clicking to browse"
	>
		{#if previewUrl}
			<img src={previewUrl} alt="Preview" class="max-w-full max-h-96 mx-auto mb-6 rounded-lg" />
			<Button on:click={proceedToAlign} size="lg">Continue to Align</Button>
		{:else}
			<p class="text-lg mb-4">Drag and drop your photo here</p>
			<p class="text-sm text-slate-600 dark:text-slate-400 mb-6">
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
		{/if}
	</div>

	<div class="mt-8 text-center">
		<p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
			Or take a photo instead
		</p>
		<Button on:click={() => goto('/create/camera')} variant="ghost">
			Use Camera
		</Button>
	</div>
</div>

