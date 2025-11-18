<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from './Button.svelte';
</script>

<header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="container flex h-16 items-center justify-between">
		<a href="/" class="flex items-center gap-2 transition-opacity hover:opacity-70">
			<svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			<span class="text-lg font-semibold tracking-tight">PassportPhoto</span>
		</a>

		<nav class="hidden md:flex items-center gap-6">
			<a href="/documents" class="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
				Documents
			</a>
			<a href="/faq" class="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground">
				FAQ
			</a>
			<Button size="sm" on:click={() => goto('/create/select-document')}>Create</Button>
		</nav>

		<div class="md:hidden">
			<Button size="sm" on:click={() => goto('/create/select-document')}>Create</Button>
		</div>
	</div>
</header>
