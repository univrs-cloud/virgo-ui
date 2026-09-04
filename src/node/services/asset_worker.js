import { forNode, isAvailable } from 'libs/webrtc_transport';

let started = false;
let messageHandler = null;

const nodeIdFromPath = () => {
	return new URL(document.baseURI).pathname.match(/^\/nodes\/([^/]+)\//)?.[1] ?? null;
};

const isSupported = () => {
	return 'serviceWorker' in navigator && isAvailable();
};

const reply = (payload, transfer) => {
	navigator.serviceWorker.controller?.postMessage(payload, transfer ?? []);
};

const serve = async (nodeId, id, path) => {
	const transport = await forNode(nodeId);
	const asset = await transport.fetchAsset(path);
	const body = asset.body.buffer.slice(asset.body.byteOffset, asset.body.byteOffset + asset.body.byteLength);
	reply({ type: 'asset:response', id, ok: true, status: asset.status, headers: asset.headers, body }, [body]);
};

const start = async () => {
	const nodeId = nodeIdFromPath();
	if (started || !nodeId || !isSupported()) {
		return;
	}
	started = true;

	messageHandler = (event) => {
		const data = event.data || {};
		if (data.type !== 'asset:request') {
			return;
		}

		serve(nodeId, data.id, data.path).catch((error) => {
			reply({ type: 'asset:response', id: data.id, ok: false, message: error?.message || 'Asset unavailable' });
		});
	};
	navigator.serviceWorker.addEventListener('message', messageHandler);

	try {
		await navigator.serviceWorker.register('/sw.js');
		await navigator.serviceWorker.ready;
	} catch (error) {
		stop();
	}
};

const stop = () => {
	if (messageHandler) {
		navigator.serviceWorker.removeEventListener('message', messageHandler);
		messageHandler = null;
	}
	started = false;
};

export {
	start,
	stop,
	isSupported
};
