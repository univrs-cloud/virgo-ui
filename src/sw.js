// Push-only service worker for the fleet PWA. It does no precaching or offline caching — its sole
// job is to surface the update notifications virgo-fleet pushes while the app is closed. Registered
// for the fleet role (see fleet/services/push) and, for the WebRTC asset bridge below, by the node
// role (see node/services/asset_worker).

const NODE_ASSET_PATTERN = /^\/nodes\/([^/]+)\/(.+)$/;
const STATIC_ASSET_PATTERN = /\.(?:js|mjs|css|map|json|txt|wasm|png|jpe?g|gif|svg|ico|webp|avif|woff2?|ttf|eot)$/i;
const ASSET_TIMEOUT_MS = 15000;

const pendingAssets = new Map();
let nextAssetId = 1;

self.addEventListener('install', () => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
	let data = {};
	try {
		data = event.data ? event.data.json() : {};
	} catch (error) {
		data = {};
	}
	const title = data.title || 'Updates available';
	// One notification per node per kind (updates vs storage), replaced in place if the node re-notifies.
	const kind = data.type || 'node-updates';
	event.waitUntil(
		self.registration.showNotification(title, {
			body: data.body || '',
			icon: '/assets/fleet-icons/icon_192x192.png',
			badge: '/assets/fleet-icons/icon_96x96.png',
			tag: data.nodeId ? `${kind}-${data.nodeId}` : kind,
			renotify: true,
			data: { nodeId: data.nodeId || null }
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const nodeId = event.notification.data?.nodeId;
	const target = nodeId ? `/nodes/${nodeId}/` : '/';
	// Focus an existing window (navigating it to the node) rather than opening a duplicate.
	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			for (const client of clients) {
				if ('focus' in client) {
					client.navigate(target);
					return client.focus();
				}
			}
			return self.clients.openWindow(target);
		})
	);
});

self.addEventListener('message', (event) => {
	const data = event.data || {};
	if (data.type !== 'asset:response') {
		return;
	}

	const pending = pendingAssets.get(data.id);
	if (!pending) {
		return;
	}
	pendingAssets.delete(data.id);
	clearTimeout(pending.timer);
	if (!data.ok) {
		pending.reject(new Error(data.message || 'Asset unavailable'));
		return;
	}

	pending.resolve(new Response(data.body, { status: data.status || 200, headers: data.headers || {} }));
});

const requestAssetFromClient = async (clientId, path) => {
	const client = clientId ? await self.clients.get(clientId) : null;
	if (!client) {
		throw new Error('No controlled client');
	}

	const id = nextAssetId;
	nextAssetId += 1;
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			pendingAssets.delete(id);
			reject(new Error('Asset request timed out'));
		}, ASSET_TIMEOUT_MS);
		pendingAssets.set(id, { resolve, reject, timer });
		client.postMessage({ type: 'asset:request', id, path });
	});
};

self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET' || request.mode === 'navigate') {
		return;
	}

	let url = null;
	try {
		url = new URL(request.url);
	} catch (error) {
		return;
	}

	if (url.origin !== self.location.origin) {
		return;
	}

	const match = NODE_ASSET_PATTERN.exec(url.pathname);
	if (!match || !STATIC_ASSET_PATTERN.test(url.pathname)) {
		return;
	}

	event.respondWith(
		requestAssetFromClient(event.clientId, `/${match[2]}${url.search}`)
			.catch(() => { return fetch(request); })
	);
});
