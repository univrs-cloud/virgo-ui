import { activeTransport, forNode, isAvailable, onTransportChange } from 'libs/webrtc_transport';

const REQUEST_TYPE = 'virgo:asset:request';
const READY_TYPE = 'virgo:asset:ready';
const UNREADY_TYPE = 'virgo:asset:unready';
const PROBE_TYPE = 'virgo:asset:probe';
const TRANSPORT_WAIT_MS = 10000;

let activeNodeId = null;

const transferableBytes = (value) => {
	if (value.byteOffset === 0 && value.buffer.byteLength === value.byteLength) {
		return value.buffer;
	}
	return value.slice().buffer;
};

const announceReady = (nodeId) => {
	navigator.serviceWorker.controller?.postMessage({ type: READY_TYPE, nodeId });
};

const announceUnready = () => {
	navigator.serviceWorker.controller?.postMessage({ type: UNREADY_TYPE });
};

const announceWhenReady = (nodeId) => {
	const pending = activeTransport(nodeId);
	if (!pending) {
		return;
	}
	pending.then(() => { announceReady(nodeId); }).catch(() => {});
};

const prepareTransport = (nodeId, timeoutMs = TRANSPORT_WAIT_MS) => {
	if (!nodeId || !isAvailable()) {
		return Promise.resolve(false);
	}

	let timer = null;
	const attempt = forNode(nodeId).then(() => {
		announceReady(nodeId);
		return true;
	}).catch(() => { return false; });
	const deadline = new Promise((resolve) => {
		timer = setTimeout(() => { resolve(false); }, timeoutMs);
	});

	return Promise.race([attempt, deadline]).finally(() => { clearTimeout(timer); });
};

const serve = async (port, { nodeId, path, flowControl, acceptEncoding }) => {
	if (flowControl !== true) {
		throw new Error('Asset bridge requires flow control');
	}
	const pending = activeTransport(nodeId);
	if (!pending) {
		throw new Error('No WebRTC transport for this node');
	}

	const abort = new AbortController();
	let reader = null;
	let timer = null;
	let reading = false;
	const stop = () => {
		clearTimeout(timer);
		abort.abort();
		reader?.cancel().catch(() => {});
		port.close();
	};
	const armTimeout = () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			port.postMessage({ type: 'error', message: 'Asset consumer stalled' });
			stop();
		}, 30000);
	};
	port.onmessage = ({ data }) => {
		if (data?.type === 'abort') {
			stop();
			return;
		}
		if (data?.type !== 'pull' || !reader || reading || abort.signal.aborted) {
			return;
		}
		reading = true;
		armTimeout();
		reader.read().then(({ done, value }) => {
			if (abort.signal.aborted) { return; }
			if (done) {
				port.postMessage({ type: 'end' });
				stop();
				return;
			}
			const bytes = transferableBytes(value);
			port.postMessage({ type: 'chunk', bytes }, [bytes]);
			armTimeout();
		}).catch((error) => {
			if (!abort.signal.aborted) {
				port.postMessage({ type: 'error', message: error.message });
				stop();
			}
		}).finally(() => { reading = false; });
	};
	armTimeout();
	try {
		const transport = await pending;
		const { status, headers, stream } = await transport.fetchAsset(path, { signal: abort.signal, acceptEncoding });
		reader = stream.getReader();
		if (abort.signal.aborted) {
			stop();
			return;
		}
		port.postMessage({ type: 'head', status, headers, flowControl: true });
		armTimeout();
	} catch (error) {
		clearTimeout(timer);
		throw error;
	}
};

const start = (nodeId) => {
	if (!('serviceWorker' in navigator) || !nodeId) {
		return;
	}
	activeNodeId = nodeId;

	onTransportChange((changedNodeId, ready) => {
		if (changedNodeId !== activeNodeId) {
			return;
		}
		if (ready) {
			announceReady(changedNodeId);
			return;
		}
		announceUnready();
	});

	navigator.serviceWorker.addEventListener('message', (event) => {
		if (event.data?.type === PROBE_TYPE) {
			announceWhenReady(nodeId);
			return;
		}
		if (event.data?.type !== REQUEST_TYPE) {
			return;
		}
		const port = event.ports?.[0];
		if (!port) {
			return;
		}
		serve(port, event.data).catch((error) => {
			try {
				port.postMessage({ type: 'error', message: error?.message || 'Asset fetch failed' });
				port.close();
			} catch (ignored) {
				return;
			}
		});
	});

	navigator.serviceWorker.addEventListener('controllerchange', () => { announceWhenReady(nodeId); });
	navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
		.then((registration) => {
			registration.update().catch(() => {});
			announceWhenReady(nodeId);
		})
		.catch((error) => {
			console.error('Error registering the asset service worker:', error);
		});
};

export { start, prepareTransport, REQUEST_TYPE, READY_TYPE, UNREADY_TYPE, PROBE_TYPE };
