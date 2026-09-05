// Service worker for the fleet PWA. It does no precaching or offline caching. It surfaces the update
// notifications virgo-fleet pushes while the app is closed, and routes node static assets to the
// requesting page's WebRTC data channel so they reach the browser direct from the node instead of
// hairpinning through the fleet. Registered by the fleet role for push (see fleet/services/push) and
// by a node view for asset routing (see libs/node_asset_bridge).

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

const NODE_ASSET_PATTERN = /^\/nodes\/([^/]+)\/(.+)$/;
const ASSET_EXTENSION_PATTERN = /\.(js|mjs|css|map|json|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf|eot|txt|webmanifest)$/i;
const ASSET_REQUEST_TYPE = 'virgo:asset:request';
const ASSET_READY_TYPE = 'virgo:asset:ready';
const ASSET_UNREADY_TYPE = 'virgo:asset:unready';
const ASSET_PROBE_TYPE = 'virgo:asset:probe';
const ASSET_HEAD_TIMEOUT_MS = 5000;
const ASSET_MAX_FRAME_BYTES = 64 * 1024;
const ASSET_ACCEPT_ENCODING = (typeof DecompressionStream === 'function') ? 'gzip' : null;

const readyClients = new Map();

self.addEventListener('message', (event) => {
	const clientId = event.source?.id;
	if (!clientId) {
		return;
	}
	if (event.data?.type === ASSET_READY_TYPE) {
		readyClients.set(clientId, event.data.nodeId || null);
		return;
	}
	if (event.data?.type === ASSET_UNREADY_TYPE) {
		readyClients.delete(clientId);
	}
});

const probeClient = (clientId) => {
	self.clients.get(clientId)
		.then((client) => { client?.postMessage({ type: ASSET_PROBE_TYPE }); })
		.catch(() => {});
};

const decodeAssetBody = (stream, encoding) => {
	if (encoding !== 'gzip') {
		return stream;
	}
	return stream.pipeThrough(new DecompressionStream('gzip'));
};

const requestAssetFromPage = (client, nodeId, path) => {
	return new Promise((resolve, reject) => {
		const channel = new MessageChannel();
		let controller = null;
		let settled = false;
		let finished = false;
		let resolvePull = null;
		const finishPull = () => {
			const resolve = resolvePull;
			resolvePull = null;
			resolve?.();
		};

		const fail = (message) => {
			if (finished) { return; }
			finished = true;
			clearTimeout(timer);
			channel.port1.postMessage({ type: 'abort' });
			const error = new Error(message || 'Asset fetch failed');
			if (!settled) {
				settled = true;
				clearTimeout(timer);
				reject(error);
			} else if (controller) {
				try {
					controller.error(error);
				} catch (ignored) {
					controller = null;
				}
			}
			channel.port1.close();
			finishPull();
		};

		let timer = setTimeout(() => { fail('Asset request timed out'); }, ASSET_HEAD_TIMEOUT_MS);

		channel.port1.onmessage = ({ data }) => {
			if (finished) { return; }
			if (data?.type === 'head') {
				if (settled) {
					return;
				}
				if (data.flowControl !== true) {
					fail('Asset page does not support flow control');
					return;
				}
				settled = true;
				clearTimeout(timer);
				const stream = new ReadableStream({
					start: (streamController) => { controller = streamController; },
					pull: () => {
						if (finished) { return; }
						return new Promise((resolve) => {
							resolvePull = resolve;
							timer = setTimeout(() => { fail('Asset body stalled'); }, 30000);
							channel.port1.postMessage({ type: 'pull' });
						});
					},
					cancel: () => {
						finished = true;
						clearTimeout(timer);
						finishPull();
						try {
							channel.port1.postMessage({ type: 'abort' });
						} catch (ignored) {
							controller = null;
						}
						channel.port1.close();
					}
				}, { highWaterMark: 0 });
				resolve({ status: data.status, headers: data.headers || {}, stream });
				return;
			}
			if (data?.type === 'chunk') {
				if (!resolvePull || !(data.bytes instanceof ArrayBuffer) || data.bytes.byteLength > ASSET_MAX_FRAME_BYTES) {
					fail('Unexpected asset chunk');
					return;
				}
				clearTimeout(timer);
				try {
					controller?.enqueue(new Uint8Array(data.bytes));
				} catch (ignored) {
					fail('Asset stream is not writable');
				}
				finishPull();
				return;
			}
			if (data?.type === 'end') {
				if (!settled) {
					fail('Asset stream ended before its response');
					return;
				}
				finished = true;
				clearTimeout(timer);
				try {
					controller?.close();
				} catch (ignored) {
					controller = null;
				}
				channel.port1.close();
				finishPull();
				return;
			}
			if (data?.type === 'error') {
				fail(data.message);
			}
		};

		client.postMessage({
			type: ASSET_REQUEST_TYPE,
			nodeId,
			path,
			flowControl: true,
			acceptEncoding: ASSET_ACCEPT_ENCODING
		}, [channel.port2]);
	});
};

const routeNodeAsset = async (event, nodeId, path) => {
	const client = await self.clients.get(event.clientId);
	if (!client) {
		throw new Error('No client to route through');
	}

	const { status, headers, stream } = await requestAssetFromPage(client, nodeId, path);
	if (status >= 400) {
		stream.cancel().catch(() => {});
		throw new Error(`Node answered ${status}`);
	}

	const responseHeaders = new Headers();
	if (headers['content-type']) {
		responseHeaders.set('Content-Type', headers['content-type']);
	}
	return new Response(decodeAssetBody(stream, headers['content-encoding']), { status, headers: responseHeaders });
};

self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET' || request.mode === 'navigate' || request.headers.has('range')) {
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
	if (!match || !ASSET_EXTENSION_PATTERN.test(url.pathname)) {
		return;
	}

	if (readyClients.get(event.clientId) !== match[1]) {
		probeClient(event.clientId);
		return;
	}

	event.respondWith(
		routeNodeAsset(event, match[1], `/${match[2]}${url.search}`).catch(() => {
			readyClients.delete(event.clientId);
			return fetch(request);
		})
	);
});
