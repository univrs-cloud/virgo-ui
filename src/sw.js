// Push-only service worker for the fleet PWA. It does no precaching or offline caching — its sole
// job is to surface the update notifications virgo-fleet pushes while the app is closed. Registered
// only for the fleet role (see fleet/services/push); the node role never installs it.

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
	// One notification per node (tag), replaced in place if the node re-notifies.
	event.waitUntil(
		self.registration.showNotification(title, {
			body: data.body || '',
			icon: '/assets/fleet-icons/icon_192x192.png',
			badge: '/assets/fleet-icons/icon_96x96.png',
			tag: data.nodeId ? `node-updates-${data.nodeId}` : 'node-updates',
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
