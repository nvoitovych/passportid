<script lang="ts">
	import type { Document } from '$lib/types/document';
	import { createEventDispatcher } from 'svelte';

export let documents: Document[] = [];
export let selectedDocument: Document | null = null;
export let placeholder = 'Search and select a document...';
export let inputId: string | undefined = undefined;

	let searchQuery = '';
	let isOpen = false;
	let filteredDocs: Document[] = [];
	let highlightedIndex = -1;
	const listboxId = `document-picker-listbox-${Math.random().toString(36).substr(2, 9)}`;

	const dispatch = createEventDispatcher();

	$: {
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filteredDocs = documents.filter(
				(doc) =>
					doc.name.toLowerCase().includes(query) ||
					doc.country.toLowerCase().includes(query) ||
					doc.type.toLowerCase().includes(query) ||
					doc.description?.toLowerCase().includes(query)
			);
		} else {
			filteredDocs = documents;
		}
		highlightedIndex = -1;
		
		// Reset selected document if it's not in filtered list
		if (selectedDocument && !filteredDocs.find(doc => doc.id === selectedDocument?.id)) {
			selectedDocument = null;
			dispatch('select', null);
		}
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const newQuery = target.value;
		
		// If user clears the input, reset selected document
		if (newQuery === '' && selectedDocument) {
			selectedDocument = null;
			dispatch('select', null);
		}
		
		searchQuery = newQuery;
		isOpen = true;
	}

	function selectDocument(doc: Document) {
		selectedDocument = doc;
		searchQuery = doc.name;
		isOpen = false;
		dispatch('select', doc);
	}
	
	function clearSelection() {
		selectedDocument = null;
		searchQuery = '';
		dispatch('select', null);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) {
			if (e.key === 'Enter' || e.key === 'ArrowDown') {
				isOpen = true;
				e.preventDefault();
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				highlightedIndex = Math.min(highlightedIndex + 1, filteredDocs.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				highlightedIndex = Math.max(highlightedIndex - 1, -1);
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && filteredDocs[highlightedIndex]) {
					selectDocument(filteredDocs[highlightedIndex]);
				}
				break;
			case 'Escape':
				e.preventDefault();
				isOpen = false;
				highlightedIndex = -1;
				break;
		}
	}

	function handleFocus() {
		isOpen = true;
	}

	function handleBlur(e: FocusEvent) {
		// Delay to allow click events to fire
		setTimeout(() => {
			isOpen = false;
		}, 200);
	}
</script>

<div class="relative">
	<!-- Input -->
	<div class="relative">
		<input
			id={inputId}
			type="text"
			value={searchQuery || (selectedDocument ? selectedDocument.name : '')}
			on:input={handleInput}
			on:keydown={handleKeydown}
			on:focus={handleFocus}
			on:blur={handleBlur}
			placeholder={placeholder}
			class="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
			role="combobox"
			aria-expanded={isOpen}
			aria-haspopup="listbox"
			aria-controls={listboxId}
		/>
		{#if selectedDocument === null && searchQuery === ''}
			<!-- Force input to be empty when both are null -->
		{/if}
		<div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
			{#if selectedDocument || searchQuery}
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground transition-colors p-1"
					on:click={(e) => {
						e.stopPropagation();
						clearSelection();
					}}
					aria-label="Clear selection"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground transition-colors p-1"
				on:click={() => {
					isOpen = !isOpen;
				}}
				aria-label="Toggle dropdown"
			>
				<svg
					class="w-5 h-5 transition-transform {isOpen ? 'rotate-180' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Dropdown -->
	{#if isOpen && filteredDocs.length > 0}
		<div
			id={listboxId}
			class="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
			role="listbox"
		>
			{#each filteredDocs as doc, index}
				<button
					type="button"
					class="w-full text-left px-4 py-3 hover:bg-muted transition-colors {index === highlightedIndex
						? 'bg-muted'
						: ''} {selectedDocument?.id === doc.id ? 'bg-primary/10 border-l-2 border-primary' : ''}"
					on:click={() => selectDocument(doc)}
					role="option"
					aria-selected={selectedDocument?.id === doc.id}
				>
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<p class="font-medium text-sm">{doc.name}</p>
							<p class="text-xs text-muted-foreground mt-0.5">
								{doc.country} • {doc.type}
							</p>
						</div>
						{#if selectedDocument?.id === doc.id}
							<svg class="w-4 h-4 text-primary ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{:else if isOpen && filteredDocs.length === 0}
		<div
			class="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground"
		>
			No documents found
		</div>
	{/if}
</div>

