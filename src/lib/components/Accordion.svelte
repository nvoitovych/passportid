<script context="module" lang="ts">
	export interface AccordionItem {
		title: string;
		content: string;
	}
</script>

<script lang="ts">
	export let items: AccordionItem[] = [];

	let openIndex: number | null = null;

	function toggle(index: number) {
		openIndex = openIndex === index ? null : index;
	}
</script>

<div class="w-full">
	{#each items as item, index}
		<div class="border-b">
			<button
				type="button"
				on:click={() => toggle(index)}
				class="flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline w-full text-left"
			>
				<span>{item.title}</span>
				<svg
					class="h-4 w-4 shrink-0 transition-transform duration-200 {openIndex === index ? 'rotate-180' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>
			{#if openIndex === index}
				<div class="overflow-hidden text-sm transition-all pb-4 pt-0 text-muted-foreground">
					{item.content}
				</div>
			{/if}
		</div>
	{/each}
</div>
