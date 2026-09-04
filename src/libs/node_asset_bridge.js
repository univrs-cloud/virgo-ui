import { activeTransport } from 'libs/webrtc_transport';

const REQUEST_TYPE = 'virgo:asset:request';

const transferableBytes = (value) => {
	if (value.byteOffset === 0 && value.buffer.byteLength === value.byteLength) {
		return value.buffer;
	}
	return value.slice().buffer;
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

const start = () => {
	if (!('serviceWorker' in navigator)) {
		return;
	}

	navigator.serviceWorker.addEventListener('message', (event) => {
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

	navigator.serviceWorker.register('/sw.js').catch((error) => {});
};

export { start, REQUEST_TYPE };
