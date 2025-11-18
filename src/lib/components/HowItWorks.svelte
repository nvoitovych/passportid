<script lang="ts">
	const steps = [
		{
			icon: 'upload',
			title: 'Select Document',
			description: 'Choose your country and document type from our supported formats'
		},
		{
			icon: 'camera',
			title: 'Take Photo',
			description: 'Use your camera or upload an existing photo'
		},
		{
			icon: 'scissors',
			title: 'Auto-Crop',
			description: 'The system automatically crops your photo to meet document requirements'
		},
		{
			icon: 'download',
			title: 'Download Result',
			description: 'Get your ready photo in the correct format and size'
		}
	];

	function getIcon(icon: string) {
		const icons: Record<string, string> = {
			upload: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
			camera: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z',
			scissors: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
			download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
		};
		return icons[icon] || '';
	}
</script>

<section class="py-24 border-t border-border/40">
	<div class="container">
		<div class="text-center mb-16">
			<h2 class="text-3xl md:text-4xl font-bold mb-4">
				How it works
			</h2>
			<p class="text-lg text-muted-foreground max-w-2xl mx-auto">
				Four simple steps to your perfect document photo
			</p>
		</div>

		<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
			{#each steps as step, idx}
				<div class="text-center group">
					<div class="mb-6 inline-flex items-center justify-center">
						<div class="relative">
							<div class="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
							<div class="relative h-20 w-20 rounded-full bg-card border border-border/50 flex items-center justify-center group-hover:border-primary/50 transition-all duration-300">
								<svg class="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(step.icon)} />
								</svg>
							</div>
						</div>
					</div>
					<h3 class="text-lg font-semibold mb-2">{step.title}</h3>
					<p class="text-sm text-muted-foreground">{step.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
