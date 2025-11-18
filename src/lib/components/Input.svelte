<script lang="ts">
	export let placeholder: string = '';
	export let value: string = '';
	export let disabled: boolean = false;
</script>

<input
	type="text"
	{placeholder}
	bind:value
	{disabled}
	class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
/>
