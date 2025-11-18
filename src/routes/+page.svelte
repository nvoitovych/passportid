<script lang="ts">
	import { goto } from '$app/navigation';
	import HowItWorks from '$lib/components/HowItWorks.svelte';
	import DocumentGlobe from '$lib/components/DocumentGlobe.svelte';
	import Accordion from '$lib/components/Accordion.svelte';
	import Button from '$lib/components/Button.svelte';

	const features = [
		{
			icon: 'camera',
			title: 'Take or Upload',
			description: 'Use your smartphone camera or upload an existing photo. We guide you to capture the perfect shot.'
		},
		{
			icon: 'scissors',
			title: 'Auto-Crop & Edit',
			description: 'Automatic cropping to document requirements. Background removal and color correction included.'
		},
		{
			icon: 'check',
			title: 'Export & Print',
			description: 'Download in the correct format and size. Ready for printing or digital submission.'
		}
	];

	const benefits = [
		{
			icon: 'shield',
			title: '100% Private',
			description: 'Everything runs in your browser. Your photos never leave your device—no servers, no cloud, no uploads.'
		},
		{
			icon: 'zap',
			title: '3 Minutes',
			description: 'Get your document photo in minutes, not hours. No queues, no waiting, no appointments.'
		},
		{
			icon: 'globe',
			title: '50+ Countries',
			description: 'Support for passports, visas, ID cards, and driver licenses from over 50 countries.'
		}
	];

	const faqs = [
		{
			title: 'What documents are supported?',
			content: 'We support photos for passports, visas, ID cards, driver licenses, and other official documents for over 50 countries. Each document has specific requirements that are automatically applied.'
		},
		{
			title: 'Is it safe to use this service?',
			content: 'Yes, absolutely safe. All processing happens locally in your browser using AI models that run on your device. Your photos are never uploaded to any server and stay only on your device.'
		},
		{
			title: 'Do I need to register?',
			content: 'No registration required. The service is completely free and available without creating an account. Just select your document and start creating your photo.'
		},
		{
			title: 'How do the guidelines help me?',
			content: 'The app automatically displays visual guidelines showing where your head should be positioned, the required head size, and (for some documents) where your eye line should be. These guidelines help you align your photo correctly before cropping.'
		},
		{
			title: 'How is this service free?',
			content: 'This is a passion project and open-source initiative. The service is free because it\'s a static website hosted on Cloudflare\'s free tier. All processing happens locally in your browser, so there are no server costs. We believe in providing free, privacy-focused tools for everyone.'
		},
		{
			title: 'What are the photo requirements?',
			content: 'Photos should be clear, with a neutral expression, without glasses (unless you wear them regularly), on a light background. Our service will automatically guide you with visual guidelines showing head position and size requirements based on your selected document.'
		},
		{
			title: 'Can I use a photo from my phone?',
			content: 'Yes, you can take a photo directly with your phone camera or upload an existing photo from your gallery. The app works on mobile devices and supports both camera capture and file upload.'
		}
	];

	function getIcon(icon: string) {
		const icons: Record<string, string> = {
			camera: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z',
			scissors: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
			check: 'M5 13l4 4L19 7',
			shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
			zap: 'M13 10V3L4 14h7v7l9-11h-7z',
			globe: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
		};
		return icons[icon] || '';
	}
</script>

<svelte:head>
	<title>PassportID - Create Professional Document Photos</title>
	<meta name="description" content="Create professional passport and ID photos online. 100% offline, private, and secure." />
</svelte:head>

<!-- Hero Section -->
<section class="py-20 md:py-32 relative overflow-hidden hero-gradient">
	<div class="container mx-auto max-w-4xl text-center relative z-10">
		<!-- Open Source Badge -->
		<a
			href="https://github.com/nvoitovych/passportid"
			target="_blank"
			rel="noopener noreferrer"
			class="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full relative bg-transparent border-2 border-primary/40 hover:border-primary/60 transition-all"
		>
			<div class="relative flex items-center gap-2">
				<svg class="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
				</svg>
				<span class="text-sm font-medium text-primary">Open Source</span>
			</div>
		</a>

		<h1 class="mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
			Perfect photos for
			<span class="text-primary"> any document</span>
		</h1>

		<p class="mb-10 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
			Get your document photo in a minute. Free, private, and completely offline—your data never leaves your browser.
		</p>

		<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
			<Button size="lg" on:click={() => goto('/create/select-document')}>
				<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
				Start Creating
			</Button>
			<Button size="lg" variant="outline" on:click={() => goto('/documents')}>
				Browse Documents
			</Button>
		</div>
	</div>
</section>

<!-- Features -->
<section class="border-t border-border/40 py-20">
	<div class="container">
		<div class="mx-auto max-w-2xl text-center mb-16">
			<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
				What it does
			</h2>
			<p class="text-muted-foreground md:text-lg">
				Professional document photos with minimal effort
			</p>
		</div>

		<div class="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
			{#each features as feature, idx}
				<div class="rounded-2xl border border-border/50 bg-card p-8 transition-all hover:shadow-lg hover:border-primary/20">
					<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
						<svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(feature.icon)} />
						</svg>
					</div>
					<h3 class="mb-2 text-xl font-semibold">{feature.title}</h3>
					<p class="text-muted-foreground">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- How it works -->
<HowItWorks />

<!-- Privacy & Security -->
<section class="border-t border-border/40 py-24 bg-secondary/30">
	<div class="container">
		<div class="grid lg:grid-cols-2 gap-12 items-stretch max-w-6xl mx-auto">
			<div class="flex flex-col">
				<h2 class="text-3xl md:text-4xl font-bold mb-6">
					Complete privacy and security
				</h2>
				<p class="text-lg text-muted-foreground mb-8">
					Your photos never leave your device. Everything runs locally in your browser—no servers, no cloud, no data transmission.
				</p>
				<div class="space-y-4">
					{#each benefits as benefit, idx}
						<div class="flex gap-4">
							<div class="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
								<svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(benefit.icon)} />
								</svg>
							</div>
							<div>
								<h3 class="font-semibold mb-1">{benefit.title}</h3>
								<p class="text-sm text-muted-foreground">{benefit.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="relative flex items-center">
				<div class="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl" />
				<div class="relative rounded-2xl border border-border/50 bg-card p-8 text-center w-full h-full flex flex-col justify-center">
					<svg class="h-20 w-20 text-primary mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon('shield')} />
					</svg>
					<p class="text-2xl font-bold mb-2">100% Offline</p>
					<p class="text-muted-foreground">Your data stays secure</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Globe Section -->
<section class="border-t border-border/40 py-24">
	<div class="container">
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold mb-4">
				Documents for countries worldwide
			</h2>
			<p class="text-lg text-muted-foreground max-w-2xl mx-auto">
				Supporting official requirements for over 50 countries
			</p>
		</div>
		<DocumentGlobe />
		
		<div class="text-center mt-12">
			<Button size="lg" variant="outline" on:click={() => goto('/documents')}>
				View All Documents
			</Button>
		</div>
	</div>
</section>

<!-- FAQ -->
<section class="border-t border-border/40 py-20">
	<div class="container">
		<div class="mx-auto max-w-3xl">
			<div class="text-center mb-12">
				<h2 class="text-3xl md:text-4xl font-bold mb-4">
					Frequently Asked Questions
				</h2>
				<p class="text-lg text-muted-foreground">
					Answers to common questions about the service
				</p>
			</div>

			<Accordion items={faqs} />

			<div class="text-center mt-12">
				<Button size="lg" variant="outline" on:click={() => goto('/faq')}>
					View All FAQs
				</Button>
			</div>
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="container py-20">
	<div class="mx-auto max-w-2xl text-center">
		<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
			Ready to create your document photo?
		</h2>
		<p class="mb-8 text-lg text-muted-foreground">
			Start now and get your photo ready in minutes
		</p>
		<Button size="lg" on:click={() => goto('/create/select-document')}>
			<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			Get Started
		</Button>
	</div>
</section>
