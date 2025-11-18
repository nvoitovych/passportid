<script lang="ts">
	import Accordion from '$lib/components/Accordion.svelte';

	const faqItems = [
		{
			title: 'Is my data secure?',
			content:
				'Yes. All photo processing happens locally in your browser. No images or data are sent to any server. Your privacy is completely protected. The AI models for background removal run entirely on your device using TensorFlow.js.'
		},
		{
			title: 'Does it work offline?',
			content:
				'Yes, once the app is loaded, it works completely offline. You can process photos without an internet connection. The app is a Progressive Web App (PWA) that caches all necessary resources for offline use.'
		},
		{
			title: 'What documents are supported?',
			content:
				'We support photos for passports, visas, ID cards, driver licenses, and other official documents for over 50 countries. Each document has specific requirements for size, DPI, background, head position, and eye line placement that are automatically applied.'
		},
		{
			title: 'How do the guidelines work?',
			content:
				'The app automatically displays visual guidelines based on your selected document requirements. You\'ll see lines indicating where your head should be positioned, the minimum head size, and (for some documents) where your eye line should be. These guidelines help you align your photo correctly before cropping.'
		},
		{
			title: 'What formats are supported?',
			content:
				'You can upload PNG or JPEG images and export in the same formats. The app automatically handles format conversion based on your document requirements. Export dimensions and DPI are calculated automatically from the document specifications.'
		},
		{
			title: 'How accurate is the background removal?',
			content:
				'The background removal uses AI-powered segmentation (MediaPipe Selfie Segmentation) that runs entirely on your device. It\'s designed specifically for headshots and provides smooth edges. For best results, use photos with clear contrast between subject and background. The processing may take a few seconds, and you\'ll see a progress indicator.'
		},
		{
			title: 'Can I customize the background color?',
			content:
				'Yes, after removing the background, you can choose from preset colors or use a custom color picker. You can also keep the background transparent (no background) if your document allows it. The app remembers your color choice when switching between transparent and colored backgrounds.'
		},
		{
			title: 'Can I use this for official documents?',
			content:
				'Yes, the app follows official document photo requirements including size, DPI, background, head position, and eye line specifications for over 50 countries. The requirements are based on official sources. However, always verify the final photo meets your specific country or institution requirements before submission.'
		},
		{
			title: 'Is this free to use?',
			content: 'Yes, the app is completely free to use with no hidden costs or subscriptions. No registration or account creation is required.'
		},
		{
			title: 'How is this service free?',
			content: 'This is a passion project and open-source initiative. The service is free because it\'s a static website hosted on Cloudflare\'s free tier. All processing happens locally in your browser using client-side AI models (TensorFlow.js), so there are no server costs. We believe in providing free, privacy-focused tools for everyone. The code is open source, and we welcome contributions from the community.'
		}
	];
</script>

<svelte:head>
	<title>FAQ - PassportID</title>
</svelte:head>

<div class="container py-12">
	<div class="mx-auto max-w-3xl">
		<h1 class="text-4xl font-bold mb-12">Frequently Asked Questions</h1>
		<Accordion items={faqItems} />
	</div>
</div>
