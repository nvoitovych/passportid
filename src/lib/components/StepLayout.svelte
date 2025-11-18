<script lang="ts">
	import StepProgress from './StepProgress.svelte';
	import StepNavigation from './StepNavigation.svelte';
	
	export let currentStep: number;
	export let title: string;
	// Unused props kept for API compatibility
	export const showBack: boolean = true;
	export const onReset: (() => void) | null = null;
</script>

<div class="container py-4 md:py-6 max-w-7xl mx-auto flex flex-col" aria-label={title}>
	<!-- Step Progress -->
	<div class="mb-4 md:mb-6">
		<StepProgress {currentStep} />
	</div>

	<!-- Main Content -->
	<div class="flex-1 mb-8">
		<slot />
	</div>
	
	<!-- Step Navigation (Back/Reset) - Hidden, now handled by StepActionBar -->
	<!-- <StepNavigation {currentStep} {showBack} {onReset} /> -->
</div>

