<script lang="ts">
	export let padding: 'sm' | 'md' | 'lg' | 'none' = 'md';
</script>

<div
	class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
	class:p-2={padding === 'sm'}
	class:p-4={padding === 'md'}
	class:p-6={padding === 'lg'}
	class:p-0={padding === 'none'}
>
	<slot />
</div>

