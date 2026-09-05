import { activeTransport } from 'libs/webrtc_transport';

const REQUEST_TYPE = 'virgo:asset:request';
const READY_TYPE = 'virgo:asset:ready';
const PROBE_TYPE = 'virgo:asset:probe';

const transferableBytes = (value) => {
	if (value.byteOffset === 0 && value.buffer.byteLength === value.byteLength) {
		return value.buffer;
	}
	return value.slice().buffer;
};

const announceWhenReady = (nodeId) => {
	const pending = activeTransport(nodeId);
	if (!pending) {
		return;
	}
	pending.then(() => {
		navigator.serviceWorker.controller?.postMessage({ type: READY_TYPE, nodeId });
	}).catch(() => {});
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
	navigator.serviceWorker.register('/sw.js')
		.then(() => { announceWhenReady(nodeId); })
		.catch((error) => {});
};

export { start, REQUEST_TYPE, READY_TYPE, PROBE_TYPE };
