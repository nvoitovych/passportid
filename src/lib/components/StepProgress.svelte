<script lang="ts">
	export let currentStep: number;
	const steps = [
		{ id: 1, label: 'Select Document', route: '/create/select-document' },
		{ id: 2, label: 'Take/Upload Photo', route: '/create/photo' },
		{ id: 3, label: 'Align & Crop', route: '/create/align' },
		{ id: 4, label: 'Enhance', route: '/create/edit' },
		{ id: 5, label: 'Export', route: '/create/export' }
	];
</script>

<div class="w-full max-w-5xl mx-auto py-2">
	<div class="flex items-center justify-between">
		{#each steps as step, index}
			<div class="flex items-center flex-1 {index < steps.length - 1 ? 'mr-1' : ''}">
				<!-- Step Circle -->
				<div class="flex flex-col items-center flex-1">
					<div
						class="w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-all {step.id === currentStep
							? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
							: step.id < currentStep
								? 'bg-primary text-primary-foreground'
								: 'bg-muted text-muted-foreground'}"
					>
						{#if step.id < currentStep}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						{:else}
							{step.id}
						{/if}
					</div>
					<!-- Step Label -->
					<span
						class="mt-1.5 text-[11px] font-medium text-center leading-tight {step.id === currentStep
							? 'text-foreground'
							: step.id < currentStep
								? 'text-muted-foreground'
								: 'text-muted-foreground'}"
					>
						{step.label}
					</span>
				</div>
				<!-- Connector Line -->
				{#if index < steps.length - 1}
					<div
						class="flex-1 h-0.5 mx-1.5 -mt-4 {step.id < currentStep ? 'bg-primary' : 'bg-muted'}"
					></div>
				{/if}
			</div>
		{/each}
	</div>
</div>

