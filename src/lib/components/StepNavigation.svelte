<script lang="ts">
	import { goto } from '$app/navigation';
	import { selectedDocument } from '$lib/stores/documentStore';
	import { photoState } from '$lib/stores/photoStore';
	import Button from '$lib/components/Button.svelte';
	import { createEventDispatcher } from 'svelte';

	export let currentStep: number;
	export let showBack: boolean = true;
	export let showReset: boolean = true;
	export let onReset: (() => void) | null = null;

	const dispatch = createEventDispatcher();

	const stepRoutes = [
		'/create/select-document',
		'/create/photo',
		'/create/align',
		'/create/edit',
		'/create/export'
	];

	function goBack() {
		if (currentStep > 1) {
			const prevRoute = stepRoutes[currentStep - 2];
			goto(prevRoute);
		}
	}

	function resetFlow() {
		// If on first step, call custom reset handler if provided
		if (currentStep === 1 && onReset) {
			onReset();
			return;
		}
		
		// Clear all stores
		selectedDocument.set(null);
		photoState.set({});
		
		// Navigate to first step
		goto('/create/select-document');
		
		// Dispatch event for any additional cleanup
		dispatch('reset');
	}
	
	// On first step, button should be disabled if there's nothing to reset
	$: isFirstStepDisabled = currentStep === 1 && !onReset;
</script>

<div class="flex items-center justify-between gap-4 pt-4 border-t border-border">
	<div class="flex gap-2">
		{#if showBack && currentStep > 1}
			<Button variant="ghost" on:click={goBack} size="sm">
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back
			</Button>
		{/if}
	</div>
	
	{#if showReset}
		<button
			type="button"
			on:click={resetFlow}
			disabled={isFirstStepDisabled}
			title={isFirstStepDisabled ? "Nothing to reset on the first step" : "Reset and start over"}
			class="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted-foreground"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
			Start Over
		</button>
	{/if}
</div>

