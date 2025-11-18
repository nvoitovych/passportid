<script lang="ts">
	export let value: string = '#ffffff';

	// Passport photo background color presets
	const presetColors = [
		{ color: '#ffffff', label: 'White' },
		{ color: '#f0f8ff', label: 'Light Blue' },
		{ color: '#e6f3ff', label: 'Sky Blue' },
		{ color: '#f5f5dc', label: 'Beige' },
		{ color: '#faf0e6', label: 'Linen' },
		{ color: '#f0f0f0', label: 'Light Gray' },
		{ color: '#e8e8e8', label: 'Gray' },
		{ color: '#d3d3d3', label: 'Silver' },
		{ color: '#000000', label: 'Black' }
	];
</script>

	<div class="flex flex-col gap-3">
	<div class="flex gap-2 flex-wrap">
		{#each presetColors as preset}
			<button
				type="button"
				on:click={() => (value = preset.color)}
				class="relative w-10 h-10 rounded border-2 transition-all"
				class:border-primary={value === preset.color}
				class:border-slate-300={value !== preset.color}
				class:dark:border-slate-600={value !== preset.color}
				style="background-color: {preset.color}"
				title={preset.label}
			></button>
		{/each}
	</div>
	<div class="flex items-center gap-2">
		<label for="custom-color-input" class="text-xs text-muted-foreground whitespace-nowrap">Custom:</label>
		<input
			id="custom-color-input"
			type="color"
			bind:value
			class="w-10 h-10 rounded border border-border cursor-pointer"
			title="Pick custom color"
		/>
		<input
			type="text"
			bind:value
			class="flex-1 px-3 py-1.5 border border-border rounded bg-background text-sm"
			placeholder="#ffffff"
			pattern="^#[0-9A-Fa-f]{6}$"
		/>
	</div>
</div>

