import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache requirements config JSON file
registerRoute(
	({ url }) => url.pathname.includes('/requirements-config.json'),
	new NetworkFirst({
		cacheName: 'documents-cache',
		plugins: [
			{
				cacheKeyWillBeUsed: async ({ request }) => {
					return request.url;
				}
			}
		]
	})
);

// Cache static assets with CacheFirst
registerRoute(
	({ request }) => request.destination === 'image' || request.destination === 'font',
	new CacheFirst({
		cacheName: 'static-assets-cache'
	})
);

// Network first for API calls (if any)
registerRoute(
	({ url }) => url.origin === self.location.origin,
	new NetworkFirst({
		cacheName: 'pages-cache'
	})
);

