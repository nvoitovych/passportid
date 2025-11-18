<svelte:head>
	<title>Offline Mode - PassportID</title>
</svelte:head>

<div class="container py-12">
	<div class="mx-auto max-w-4xl">
		<h1 class="text-4xl font-bold mb-8">Offline Mode</h1>

		<div class="space-y-6">
			<section class="bg-card rounded-2xl border border-border/50 p-6">
				<h2 class="text-2xl font-semibold mb-4">How It Works</h2>
				<p class="text-muted-foreground leading-relaxed">
					Once the app is loaded in your browser, it can work completely offline. All photo
					processing happens locally using your device's resources.
				</p>
			</section>

			<section class="bg-card rounded-2xl border border-border/50 p-6">
				<h2 class="text-2xl font-semibold mb-4">PWA Support</h2>
				<p class="text-muted-foreground leading-relaxed mb-4">
					You can install this app as a Progressive Web App (PWA) on your device for easier access
					and better offline performance.
				</p>
				<p class="text-sm text-muted-foreground">
					Look for the "Add to Home Screen" option in your browser menu.
				</p>
			</section>

			<section class="bg-card rounded-2xl border border-border/50 p-6">
				<h2 class="text-2xl font-semibold mb-4">What Works Offline</h2>
				<ul class="list-disc list-inside space-y-2 text-muted-foreground">
					<li>Photo upload and processing</li>
					<li>Background removal</li>
					<li>Photo editing and adjustments</li>
					<li>Export and download</li>
					<li>Document selection (cached data)</li>
				</ul>
			</section>
		</div>
	</div>
</div>
