<script lang="ts">
	import Button from './Button.svelte';
	
	export let primaryAction: {
		label: string;
		onClick: () => void;
		disabled?: boolean;
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
	} | null = null;
	
	export let secondaryActions: Array<{
		label: string;
		onClick: () => void;
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		disabled?: boolean;
	}> = [];
	
	export let leftActions: Array<{
		label: string;
		onClick: () => void;
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		disabled?: boolean;
		icon?: string;
	}> = [];
</script>

{#if primaryAction || secondaryActions.length > 0 || leftActions.length > 0}
	<div class="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border pt-3 pb-3 -mx-6 px-6 z-10 mb-0">
		<div class="container max-w-7xl mx-auto">
			<div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
				<!-- Left Actions (Back, Start Over, etc.) -->
				<div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
					{#each leftActions as action}
						<Button
							variant={action.variant || 'ghost'}
							on:click={action.onClick}
							size="lg"
							class="w-full sm:w-auto flex items-center"
							disabled={action.disabled}
						>
							{#if action.icon}
								{@html action.icon}
							{/if}
							<span class={action.icon ? 'ml-2' : ''}>{action.label}</span>
						</Button>
					{/each}
				</div>
				
				<!-- Right Actions (Secondary + Primary) -->
				<div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
					{#each secondaryActions as action}
						<Button
							variant={action.variant || 'outline'}
							on:click={action.onClick}
							size="lg"
							class="w-full sm:w-auto sm:min-w-[140px]"
							disabled={action.disabled}
						>
							{action.label}
						</Button>
					{/each}
					{#if primaryAction}
						<Button
							variant={primaryAction.variant || 'default'}
							on:click={primaryAction.onClick}
							size="lg"
							class="w-full sm:w-auto sm:min-w-[200px]"
							disabled={primaryAction.disabled}
						>
							{primaryAction.label}
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

