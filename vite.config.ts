import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'prompt',
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'service-worker.js',
			devOptions: {
				enabled: true,
				type: 'module'
			},
			manifest: {
				name: 'PassportPhoto',
				short_name: 'PassportPhoto',
				description: 'Create professional document photos offline',
				theme_color: '#3c9f95',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait-primary',
				start_url: '/',
				scope: '/',
				icons: [
					{
						src: '/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				]
			}
		})
	],
});
