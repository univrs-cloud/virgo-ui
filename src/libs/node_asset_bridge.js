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

const serve = async (port, { nodeId, path }) => {
	const pending = activeTransport(nodeId);
	if (!pending) {
		throw new Error('No WebRTC transport for this node');
	}

	const transport = await pending;
	const { status, headers, stream } = await transport.fetchAsset(path);
	port.postMessage({ type: 'head', status, headers });

	const reader = stream.getReader();
	port.onmessage = ({ data }) => {
		if (data?.type === 'abort') {
			reader.cancel().catch(() => {});
		}
	};

	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			break;
		}
		if (!value?.byteLength) {
			continue;
		}
		const bytes = transferableBytes(value);
		port.postMessage({ type: 'chunk', bytes }, [bytes]);
	}
	port.postMessage({ type: 'end' });
	port.close();
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
