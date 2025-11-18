<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>404 - Page Not Found</title>
</svelte:head>

<div class="container py-12">
	<div class="flex min-h-[60vh] items-center justify-center">
		<div class="text-center">
			<h1 class="text-6xl font-bold mb-4">404</h1>
			<p class="text-xl text-muted-foreground mb-8">
				Page not found
			</p>
			<Button on:click={() => goto('/')}>Go Home</Button>
		</div>
	</div>
</div>
