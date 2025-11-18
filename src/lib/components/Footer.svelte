<script lang="ts">
	import { theme } from '$lib/stores/themeStore';
	import { onMount } from 'svelte';

	onMount(() => {
		const cleanup = theme.init();
		return () => {
			if (cleanup) cleanup();
		};
	});
</script>

<footer class="border-t border-border/40 py-12">
	<div class="container">
		<div class="flex flex-col items-center justify-between gap-6 md:flex-row">
			<div class="flex flex-col items-center md:items-start gap-2">
				<p class="text-sm font-medium">Made by nv</p>
				<p class="text-xs text-muted-foreground">
					© 2025 PassportPhoto. <a href="https://github.com/nvoitovych/passportid/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" class="hover:text-foreground transition-colors">MIT License</a>
				</p>
			</div>
			<div class="flex flex-col items-center gap-4 md:flex-row md:gap-8">
				<!-- Theme Switcher -->
				<div class="flex items-center gap-2 rounded-lg border border-border/50 bg-card p-1">
					<button
						type="button"
						class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors {$theme === 'system' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}"
						on:click={() => theme.set('system')}
						title="Use system theme"
					>
						System
					</button>
					<button
						type="button"
						class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors {$theme === 'light' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}"
						on:click={() => theme.set('light')}
						title="Light theme"
					>
						Light
					</button>
					<button
						type="button"
						class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors {$theme === 'dark' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}"
						on:click={() => theme.set('dark')}
						title="Dark theme"
					>
						Dark
					</button>
				</div>
				
				<div class="flex gap-8">
					<a href="/faq" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
						FAQ
					</a>
					<a href="/privacy" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
						Privacy
					</a>
					<a href="/terms" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
						Terms & Conditions
					</a>
				</div>
			</div>
		</div>
	</div>
</footer>


