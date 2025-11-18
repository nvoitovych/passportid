<script lang="ts">
	export let variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' = 'default';
	export let size: 'default' | 'sm' | 'lg' | 'icon' = 'default';
	export let disabled: boolean = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	let className = '';
	export { className as class };

	$: classes = [
		'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300',
		'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
		'disabled:pointer-events-none disabled:opacity-50',
		variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md',
		variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
		variant === 'outline' && 'border border-border bg-card hover:bg-secondary/50',
		variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
		variant === 'ghost' && 'hover:bg-secondary/50',
		variant === 'link' && 'text-primary underline-offset-4 hover:underline',
		size === 'default' && 'h-11 px-6 py-2',
		size === 'sm' && 'h-9 px-4 text-xs',
		size === 'lg' && 'h-14 px-10 text-base',
		size === 'icon' && 'h-11 w-11',
		className
	].filter(Boolean).join(' ');
</script>

<button {type} {disabled} class={classes} on:click>
	<slot />
</button>
