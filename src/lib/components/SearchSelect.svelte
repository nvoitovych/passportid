<script context="module" lang="ts">
	export type SearchSelectOption = {
		label: string;
		value: string;
		description?: string;
		meta?: string;
	};
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

export let options: SearchSelectOption[] = [];
export let value: string = '';
export let placeholder: string = 'Search...';
export let clearable: boolean = true;
export let inputId: string | undefined = undefined;
export let ariaLabel: string | undefined = undefined;
export let ariaLabelledby: string | undefined = undefined;

	const dispatch = createEventDispatcher<{ select: SearchSelectOption | null }>();

	let searchQuery = '';
	let isOpen = false;
	let highlightedIndex = -1;
	const listboxId = `search-select-listbox-${Math.random().toString(36).substr(2, 9)}`;

	$: selectedOption = options.find((option) => option.value === value) || null;

	$: filteredOptions =
		searchQuery.trim().length > 0
			? options.filter((option) => {
					const query = searchQuery.toLowerCase();
					return (
						option.label.toLowerCase().includes(query) ||
						option.description?.toLowerCase().includes(query) ||
						option.meta?.toLowerCase().includes(query)
					);
			  })
			: options;

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const newQuery = target.value;

		// Only clear selection if user manually clears the input AND there was a selection
		// Don't clear if "All" option (empty value) is selected
		if (newQuery === '' && selectedOption && selectedOption.value !== '') {
			// Find the "All" option (empty value) if it exists, otherwise dispatch null
			const allOption = options.find(opt => opt.value === '');
			dispatch('select', allOption || null);
		}

		searchQuery = newQuery;
		isOpen = true;
		highlightedIndex = -1;
	}

	function selectOption(option: SearchSelectOption) {
		dispatch('select', option);
		searchQuery = option.label;
		isOpen = false;
	}

	function clearSelection() {
		// Find the "All" option (empty value) if it exists, otherwise dispatch null
		const allOption = options.find(opt => opt.value === '');
		dispatch('select', allOption || null);
		searchQuery = '';
		isOpen = false;
	}

	function handleFocus() {
		// When opening dropdown, if "All" option is selected, clear search query to show all options
		// Otherwise, set search query to selected option's label for searching
		if (selectedOption) {
			if (selectedOption.value === '') {
				// "All" option - clear search to show all options
				searchQuery = '';
			} else {
				// Regular option - set to label so user can search/modify
				searchQuery = selectedOption.label;
			}
		} else {
			searchQuery = '';
		}
		isOpen = true;
	}

	function handleBlur() {
		setTimeout(() => {
			isOpen = false;
		}, 200);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen && (event.key === 'Enter' || event.key === 'ArrowDown')) {
			isOpen = true;
			event.preventDefault();
			return;
		}

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				highlightedIndex = Math.min(highlightedIndex + 1, filteredOptions.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				highlightedIndex = Math.max(highlightedIndex - 1, -1);
				break;
			case 'Enter':
				if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
					selectOption(filteredOptions[highlightedIndex]);
					event.preventDefault();
				}
				break;
			case 'Escape':
				isOpen = false;
				highlightedIndex = -1;
				event.preventDefault();
				break;
		}
	}

	// When dropdown closes, sync searchQuery with selected option for display
	// But keep it empty if "All" option is selected so dropdown shows all options when reopened
	$: if (!isOpen && selectedOption && searchQuery !== selectedOption.label) {
		if (selectedOption.value === '') {
			// "All" option selected - keep searchQuery empty
			searchQuery = '';
		} else {
			// Normal option selected - set searchQuery to label for display
			searchQuery = selectedOption.label;
		}
	}
</script>

<div class="relative">
	<div class="relative">
		<input
			id={inputId}
			type="text"
			value={isOpen ? searchQuery : (selectedOption?.label || searchQuery || '')}
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
			aria-label={ariaLabel}
			aria-labelledby={ariaLabelledby}
		/>

		<div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
			{#if clearable && (selectedOption || searchQuery)}
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground transition-colors p-1"
					on:click={(event) => {
						event.stopPropagation();
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
				on:click={() => (isOpen = !isOpen)}
				aria-label="Toggle dropdown"
			>
				<svg class="w-5 h-5 transition-transform {isOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
		</div>
	</div>

	{#if isOpen && filteredOptions.length > 0}
		<div id={listboxId} class="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto" role="listbox">
			{#each filteredOptions as option, index}
				<button
					type="button"
					class="w-full text-left px-4 py-3 hover:bg-muted transition-colors {index === highlightedIndex ? 'bg-muted' : ''} {option.value === selectedOption?.value ? 'bg-primary/10 border-l-2 border-primary' : ''}"
					on:click={() => selectOption(option)}
					role="option"
					aria-selected={option.value === selectedOption?.value}
				>
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<p class="font-medium text-sm">{option.label}</p>
							{#if option.description}
								<p class="text-xs text-muted-foreground mt-0.5">{option.description}</p>
							{/if}
							{#if option.meta}
								<p class="text-[11px] uppercase tracking-wide text-muted-foreground/70 mt-0.5">
									{option.meta}
								</p>
							{/if}
						</div>
						{#if option.value === selectedOption?.value}
							<svg class="w-4 h-4 text-primary ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{:else if isOpen && filteredOptions.length === 0}
		<div class="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
			No matches found
		</div>
	{/if}
</div>

