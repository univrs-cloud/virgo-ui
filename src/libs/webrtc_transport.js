import { io } from 'socket.io-client';
import {
	EVENT_TAG,
	ASSET_TAG,
	ASSET_CHUNK_SIZE,
	MAX_MESSAGE_SIZE,
	concat,
	encodeEvent,
	decodeEvent,
	encodeContinuation,
	encodeAssetControl,
	decodeAssetFrame
} from 'libs/webrtc_frame';
import DataChannelSendQueue from 'libs/data_channel_send_queue';

const CONNECT_TIMEOUT_MS = 20000;
const SESSION_REQUEST_TIMEOUT_MS = 10000;
const CALL_TIMEOUT_MS = 30000;
const PROTOCOL_VERSION = 1;
const RETRY_COOLDOWN_MS = 60000;
const MAX_PENDING_CONTINUATIONS = 8;
const MAX_CONTINUATION_BYTES = 8 * 1024 * 1024;
const CONTINUATION_TIMEOUT_MS = 30000;
const MAX_PENDING_ICE_CANDIDATES = 128;
const HELLO_FEATURE_CLOSE = 'namespace-close';
const HELLO_FEATURE_HEARTBEAT = 'heartbeat';
const HELLO_FEATURE_ASSET_CREDIT = 'asset-credit';
const HEARTBEAT_INTERVAL_MS = 15000;
const LIVENESS_TIMEOUT_MS = 45000;
const IDLE_CLOSE_MS = 30000;
const MAX_CONCURRENT_ASSET_REQUESTS = 8;
const ASSET_CHANNEL_TIMEOUT_MS = 5000;
const ASSET_HEAD_TIMEOUT_MS = 15000;
const ASSET_BODY_TIMEOUT_MS = 30000;
const ASSET_WINDOW_CHUNKS = 8;

const transports = new Map();
const cooldowns = new Map();

const remaining = (deadline) => {
	return Math.max(1, deadline - Date.now());
};

const isAvailable = () => {
	return typeof RTCPeerConnection === 'function' && typeof RTCPeerConnection.prototype?.createDataChannel === 'function';
};

class NamespaceChannel {
	#transport;
	#namespace;
	#listeners = new Map();
	#anyListeners = new Set();
	#connected = false;
	#prepared = false;
	#closed = false;
	#waiters = new Set();
	#prepareWaiters = new Set();
	#lostListeners = new Set();
	#opened = false;

	constructor(transport, namespace) {
		this.#transport = transport;
		this.#namespace = namespace;
	}

	get namespace() {
		return this.#namespace;
	}

	get connected() {
		return this.#connected && !this.#closed;
	}

	get prepared() {
		return this.#prepared && !this.#closed;
	}

	get needsOpen() {
		return !this.#opened && !this.#closed;
	}

	markOpened() {
		this.#opened = true;
	}

	onLost(handler) {
		this.#lostListeners.add(handler);
		return () => { this.#lostListeners.delete(handler); };
	}

	#notifyLost() {
		const handlers = [...this.#lostListeners];
		this.#lostListeners.clear();
		handlers.forEach((handler) => { handler(); });
	}

	on(event, handler) {
		if (!this.#listeners.has(event)) {
			this.#listeners.set(event, new Set());
		}
		this.#listeners.get(event).add(handler);
		return this;
	}

	off(event, handler) {
		if (handler) {
			this.#listeners.get(event)?.delete(handler);
		} else {
			this.#listeners.delete(event);
		}
		return this;
	}

	once(event, handler) {
		const wrapped = (...args) => {
			this.off(event, wrapped);
			handler(...args);
		};
		return this.on(event, wrapped);
	}

	onAny(handler) {
		this.#anyListeners.add(handler);
		return this;
	}

	offAny(handler) {
		this.#anyListeners.delete(handler);
		return this;
	}

	emit(event, ...args) {
		this.#transport.sendEvent(this.#namespace, event, args);
		return this;
	}

	timeout(ms) {
		return {
			emitWithAck: (event, ...args) => {
				return this.#transport.call(this.#namespace, event, args, ms);
			}
		};
	}

	emitWithAck(event, ...args) {
		return this.#transport.call(this.#namespace, event, args, CALL_TIMEOUT_MS);
	}

	dispatch(event, args) {
		for (const handler of [...(this.#listeners.get(event) ?? [])]) {
			handler(...args);
		}
		for (const handler of [...this.#anyListeners]) {
			handler(event, ...args);
		}
	}

	#setConnected(connected) {
		if (this.#connected !== connected) {
			this.#connected = connected;
			const event = connected ? 'connect' : 'disconnect';
			const args = connected ? [] : ['transport close'];
			for (const handler of [...(this.#listeners.get(event) ?? [])]) {
				handler(...args);
			}
		}

		const waiters = [...this.#waiters];
		this.#waiters.clear();
		waiters.forEach((waiter) => { waiter(connected); });
	}

	setState({ ok, phase } = {}) {
		if (this.#closed) {
			return;
		}
		if (!ok) {
			this.#prepared = false;
			this.#opened = false;
			this.#resolvePrepareWaiters(false);
			this.#setConnected(false);
			this.#notifyLost();
			return;
		}

		// A peer predating the activation barrier returns no phase and is already live. Keeping this
		// compatibility path lets mixed-version deployments fall back safely during rolling updates.
		this.#prepared = true;
		this.#resolvePrepareWaiters(true);
		if (!phase || phase === 'active') {
			this.#setConnected(true);
		}
	}

	#resolvePrepareWaiters(prepared) {
		const waiters = [...this.#prepareWaiters];
		this.#prepareWaiters.clear();
		waiters.forEach((waiter) => { waiter(prepared); });
	}

	whenPrepared(timeoutMs) {
		if (this.prepared) {
			return Promise.resolve(this);
		}
		if (this.#closed) {
			return Promise.reject(new Error('Namespace channel is closed'));
		}

		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.#prepareWaiters.delete(waiter);
				reject(new Error('Namespace did not prepare'));
			}, timeoutMs);
			const waiter = (prepared) => {
				clearTimeout(timer);
				if (prepared) {
					resolve(this);
					return;
				}
				reject(new Error('Namespace did not prepare'));
			};
			this.#prepareWaiters.add(waiter);
		});
	}

	activate(timeoutMs) {
		if (this.connected) {
			return Promise.resolve(this);
		}
		if (!this.prepared || this.#closed) {
			return Promise.reject(new Error('Namespace is not prepared'));
		}
		this.#transport.activateNamespace(this.#namespace);
		return this.whenConnected(timeoutMs);
	}

	whenConnected(timeoutMs) {
		if (this.connected) {
			return Promise.resolve(this);
		}
		if (this.#closed) {
			return Promise.reject(new Error('Namespace channel is closed'));
		}

		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.#waiters.delete(waiter);
				reject(new Error('Namespace did not open'));
			}, timeoutMs);
			const waiter = (connected) => {
				clearTimeout(timer);
				if (connected) {
					resolve(this);
					return;
				}
				reject(new Error('Namespace did not open'));
			};
			this.#waiters.add(waiter);
		});
	}

	close({ notify = false } = {}) {
		if (this.#closed) {
			return;
		}
		this.#closed = true;
		this.#opened = false;
		this.#lostListeners.clear();
		if (notify) {
			this.#transport.closeNamespace(this.#namespace);
		}
		this.#prepared = false;
		this.#resolvePrepareWaiters(false);
		this.#setConnected(false);
		this.#waiters.clear();
	}
}

class WebrtcTransport {
	#nodeId;
	#signal = null;
	#pc = null;
	#sessionId = null;
	#token = null;
	#events = null;
	#sendQueue = null;
	#channels = new Map();
	#pendingCalls = new Map();
	#continuations = new Map();
	#nextCallId = 1;
	#nextContinuationId = 1;
	#closed = false;
	#onLost = new Set();
	#helloResolve = null;
	#helloReject = null;
	#state = 'IDLE';
	#pendingCandidates = [];
	#features = new Set();
	#idleTimer = null;
	#assets = null;
	#assetsReady = null;
	#assetRequests = new Map();
	#nextAssetId = 1;
	#heartbeatTimer = null;
	#lastInboundAt = 0;

	constructor(nodeId) {
		this.#nodeId = nodeId;
	}

	get nodeId() {
		return this.#nodeId;
	}

	get connected() {
		return !this.#closed && this.#events?.readyState === 'open';
	}

	get state() {
		return this.#state;
	}

	get supportsAssets() {
		return !this.#closed && this.#features.has(HELLO_FEATURE_ASSET_CREDIT);
	}

	onLost(handler) {
		this.#onLost.add(handler);
		return () => { this.#onLost.delete(handler); };
	}

	async start() {
		let timer;
		try {
			return await Promise.race([
				this.#start(),
				new Promise((resolve, reject) => {
					timer = setTimeout(() => { reject(new Error('WebRTC handshake timed out')); }, CONNECT_TIMEOUT_MS);
				})
			]);
		} catch (error) {
			this.close({ failed: true });
			throw error;
		} finally {
			clearTimeout(timer);
		}
	}

	async #start() {
		const deadline = Date.now() + CONNECT_TIMEOUT_MS;
		this.#state = 'REQUESTED';
		this.#signal = io(`/fleet/${this.#nodeId}/signal`, {
			path: '/api',
			reconnection: false
		});

		const ack = await this.#requestSession(remaining(deadline));
		if (this.#closed) { throw new Error('Transport closed'); }
		this.#sessionId = ack.sessionId;
		this.#token = ack.token;
		this.#state = 'OPEN_SENT';

		this.#pc = new RTCPeerConnection({ iceServers: ack.iceServers ?? [] });
		this.#pc.onicecandidate = ({ candidate }) => {
			if (candidate && this.#signal?.connected) {
				this.#signal.emit('webrtc:candidate', { sessionId: this.#sessionId, candidate: candidate.toJSON() });
			}
		};
		this.#pc.onconnectionstatechange = () => {
			if (this.#pc && (this.#pc.connectionState === 'failed' || this.#pc.connectionState === 'closed')) {
				this.#lose();
			}
		};

		this.#signal.on('webrtc:answer', ({ sessionId, sdp } = {}) => {
			if (sessionId === this.#sessionId && this.#pc && !this.#pc.currentRemoteDescription) {
				this.#state = 'ANSWERED';
				this.#applyAnswer(sdp).catch(() => { this.#lose(); });
			}
		});
		this.#signal.on('webrtc:candidate', ({ sessionId, candidate } = {}) => {
			if (sessionId === this.#sessionId && candidate) {
				if (this.#pc?.remoteDescription) {
					this.#pc.addIceCandidate(candidate).catch(() => {});
				} else if (this.#pendingCandidates.length < MAX_PENDING_ICE_CANDIDATES) {
					this.#pendingCandidates.push(candidate);
				}
			}
		});
		this.#signal.on('webrtc:close', ({ sessionId } = {}) => {
			if (!sessionId || sessionId === this.#sessionId) {
				this.#lose();
			}
		});
		this.#signal.on('webrtc:error', ({ sessionId } = {}) => {
			if (!sessionId || sessionId === this.#sessionId) {
				this.#lose();
			}
		});
		this.#signal.on('disconnect', () => { this.#lose(); });

		this.#assets = this.#pc.createDataChannel('assets', { ordered: true });
		this.#assets.binaryType = 'arraybuffer';
		this.#assets.onmessage = ({ data }) => { this.#onAssetMessage(data); };
		this.#assets.onclose = () => { this.#failAssetRequests('Asset channel closed'); };
		this.#assets.onerror = () => { this.#failAssetRequests('Asset channel failed'); };
		this.#assetsReady = new Promise((resolve) => {
			if (this.#assets.readyState === 'open') {
				resolve();
				return;
			}
			this.#assets.onopen = () => { resolve(); };
		});

		this.#events = this.#pc.createDataChannel('events', { ordered: true });
		this.#events.binaryType = 'arraybuffer';
		this.#events.onmessage = ({ data }) => { this.#onEventMessage(data); };
		this.#events.onclose = () => { this.#lose(); };
		this.#events.onerror = () => { this.#lose(); };
		this.#sendQueue = new DataChannelSendQueue(this.#events, {
			onFailure: (error) => { this.#lose({ failed: !error?.overflow }); }
		});

		const offer = await this.#pc.createOffer();
		if (this.#closed) { throw new Error('Transport closed'); }
		await this.#pc.setLocalDescription(offer);
		if (this.#closed) { throw new Error('Transport closed'); }
		this.#state = 'OFFER_SENT';
		this.#signal.emit('webrtc:offer', { sessionId: this.#sessionId, sdp: offer.sdp, token: this.#token });

		await this.#waitForHello(remaining(deadline));
		this.#state = 'CONNECTED';
		this.#scheduleIdleClose();
		return this;
	}

	async #applyAnswer(sdp) {
		await this.#pc.setRemoteDescription({ type: 'answer', sdp });
		const candidates = this.#pendingCandidates;
		this.#pendingCandidates = [];
		await Promise.allSettled(candidates.map((candidate) => {
			return this.#pc.addIceCandidate(candidate);
		}));
	}

	#requestSession(timeoutMs) {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => { reject(new Error('Signaling timed out')); }, Math.min(timeoutMs, SESSION_REQUEST_TIMEOUT_MS));
			const fail = (message) => {
				clearTimeout(timer);
				reject(new Error(message));
			};
			this.#signal.on('connect_error', (error) => { fail(error?.message || 'Signaling refused'); });
			this.#signal.on('connect', () => {
				this.#signal.emit('webrtc:session:request', (response = {}) => {
					clearTimeout(timer);
					if (response.status !== 'succeeded') {
						reject(new Error(response.message || 'Session refused'));
						return;
					}
					resolve(response);
				});
			});
		});
	}

	#waitForHello(timeoutMs) {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.#helloResolve = null;
				this.#helloReject = null;
				reject(new Error('Data channel timed out'));
			}, Math.min(timeoutMs, CONNECT_TIMEOUT_MS));
			this.#helloResolve = () => {
				clearTimeout(timer);
				resolve();
			};
			this.#helloReject = (error) => {
				clearTimeout(timer);
				reject(error);
			};
			const hello = () => {
				this.#send(this.#events, [encodeEvent(EVENT_TAG.HELLO, {
					v: PROTOCOL_VERSION,
					features: [HELLO_FEATURE_HEARTBEAT]
				})]);
			};
			this.#events.onopen = hello;
			if (this.#events.readyState === 'open') {
				hello();
			}
		});
	}

	async fetchAsset(path, { signal } = {}) {
		signal?.throwIfAborted();
		// Older nodes still use the HTTP fallback, avoiding an unbounded push stream.
		if (!this.supportsAssets) {
			throw new Error('Node does not support asset flow control');
		}
		if (this.#closed || !this.#assets) {
			throw new Error('Transport closed');
		}
		if (this.#assetRequests.size >= MAX_CONCURRENT_ASSET_REQUESTS) {
			throw new Error('Too many asset requests');
		}

		let readyTimer;
		try {
			await Promise.race([
				this.#assetsReady,
				new Promise((resolve, reject) => {
					readyTimer = setTimeout(() => { reject(new Error('Asset channel did not open')); }, ASSET_CHANNEL_TIMEOUT_MS);
				})
			]);
		} finally {
			clearTimeout(readyTimer);
		}
		if (this.#closed || this.#assets.readyState !== 'open') {
			throw new Error('Asset channel is not open');
		}
		signal?.throwIfAborted();
		if (this.#assetRequests.size >= MAX_CONCURRENT_ASSET_REQUESTS) {
			throw new Error('Too many asset requests');
		}

		const requestId = this.#nextAssetId;
		this.#nextAssetId = (this.#nextAssetId + 1) >>> 0 || 1;

		return new Promise((resolve, reject) => {
			const request = {
				controller: null,
				head: false,
				nextSeq: 0,
				credits: 0,
				resolveHead: resolve,
				rejectHead: reject,
				timer: setTimeout(() => {
					this.#abortAsset(requestId, 'Asset request timed out');
				}, ASSET_HEAD_TIMEOUT_MS)
			};
			this.#assetRequests.set(requestId, request);
			const aborted = () => { this.#abortAsset(requestId, 'Asset request cancelled'); };
			request.cleanup = () => { signal?.removeEventListener('abort', aborted); };
			signal?.addEventListener('abort', aborted, { once: true });
			if (!this.#sendAssetFrame(ASSET_TAG.REQ, requestId, { path, flowControl: true })) {
				this.#assetRequests.delete(requestId);
				request.cleanup();
				clearTimeout(request.timer);
				reject(new Error('Asset channel is not writable'));
			}
		});
	}

	#armAssetBodyTimeout(requestId, request) {
		clearTimeout(request.timer);
		request.timer = setTimeout(() => {
			this.#abortAsset(requestId, 'Asset body stalled');
		}, ASSET_BODY_TIMEOUT_MS);
	}

	#grantAssetCredit(requestId, request) {
		if (!this.#assetRequests.has(requestId)) {
			return;
		}
		const capacity = Math.floor(request.controller.desiredSize / ASSET_CHUNK_SIZE);
		const chunks = Math.max(0, capacity - request.credits);
		if (chunks) {
			request.credits += chunks;
			if (!this.#sendAssetFrame(ASSET_TAG.CREDIT, requestId, { chunks })) {
				this.#abortAsset(requestId, 'Asset channel is not writable');
				return;
			}
			this.#armAssetBodyTimeout(requestId, request);
		}
	}

	#sendAssetFrame(tag, requestId, body) {
		if (!this.#assets || this.#assets.readyState !== 'open') {
			return false;
		}
		try {
			this.#assets.send(encodeAssetControl(tag, requestId, body));
			return true;
		} catch (error) {
			return false;
		}
	}

	#settleAssetFailure(request, error) {
		if (request.controller) {
			try {
				request.controller.error(error);
			} catch (ignored) {
				return;
			}
			return;
		}
		request.rejectHead(error);
	}

	#abortAsset(requestId, message) {
		const request = this.#assetRequests.get(requestId);
		if (!request) {
			return;
		}
		this.#assetRequests.delete(requestId);
		request.cleanup();
		clearTimeout(request.timer);
		this.#sendAssetFrame(ASSET_TAG.ABORT, requestId, {});
		if (message) {
			this.#settleAssetFailure(request, new Error(message));
		}
	}

	#failAssetRequests(message) {
		const requests = [...this.#assetRequests.values()];
		this.#assetRequests.clear();
		for (const request of requests) {
			request.cleanup();
			clearTimeout(request.timer);
			this.#settleAssetFailure(request, new Error(message));
		}
	}

	#onAssetMessage(data) {
		this.#lastInboundAt = Date.now();
		const frame = decodeAssetFrame(data);
		if (!frame) {
			return;
		}
		const request = this.#assetRequests.get(frame.requestId);
		if (!request) {
			return;
		}

		switch (frame.tag) {
			case ASSET_TAG.RES: {
				if (request.head) {
					return;
				}
				clearTimeout(request.timer);
				request.timer = null;
				request.head = true;
				const stream = new ReadableStream({
					start: (controller) => { request.controller = controller; },
					pull: () => { this.#grantAssetCredit(frame.requestId, request); },
					cancel: () => { this.#abortAsset(frame.requestId, null); }
				}, { highWaterMark: ASSET_WINDOW_CHUNKS * ASSET_CHUNK_SIZE, size: (chunk) => { return chunk.byteLength; } });
				request.resolveHead({
					status: Number(frame.body?.status) || 200,
					headers: frame.body?.headers ?? {},
					stream
				});
				return;
			}
			case ASSET_TAG.CHUNK: {
				if (!request.controller || frame.seq !== request.nextSeq || request.credits <= 0 || frame.bytes.length > ASSET_CHUNK_SIZE) {
					this.#abortAsset(frame.requestId, 'Unexpected asset chunk');
					return;
				}
				request.nextSeq += 1;
				request.credits -= 1;
				clearTimeout(request.timer);
				if (request.credits > 0) {
					this.#armAssetBodyTimeout(frame.requestId, request);
				}
				request.controller.enqueue(new Uint8Array(frame.bytes));
				return;
			}
			case ASSET_TAG.END: {
				this.#assetRequests.delete(frame.requestId);
				request.cleanup();
				clearTimeout(request.timer);
				if (request.controller) {
					try {
						request.controller.close();
					} catch (error) {
						return;
					}
					return;
				}
				request.rejectHead(new Error('Asset stream ended before its response'));
				return;
			}
			case ASSET_TAG.ERR: {
				this.#assetRequests.delete(frame.requestId);
				request.cleanup();
				clearTimeout(request.timer);
				const error = new Error(frame.body?.message || 'Asset fetch failed');
				error.status = frame.body?.status;
				this.#settleAssetFailure(request, error);
				return;
			}
			default:
		}
	}

	channel(namespace) {
		if (this.#idleTimer) {
			clearTimeout(this.#idleTimer);
			this.#idleTimer = null;
		}
		let channel = this.#channels.get(namespace);
		if (!channel) {
			channel = new NamespaceChannel(this, namespace);
			this.#channels.set(namespace, channel);
		}
		if (channel.needsOpen) {
			channel.markOpened();
			this.#sendEventFrame(EVENT_TAG.OPEN, { ns: namespace, standby: true });
		}
		return channel;
	}

	sendEvent(namespace, event, args) {
		this.#sendEventFrame(EVENT_TAG.EVT, { ns: namespace, event, args });
	}

	activateNamespace(namespace) {
		this.#sendEventFrame(EVENT_TAG.ACTIVATE, { ns: namespace });
	}

	closeNamespace(namespace) {
		if (this.connected) {
			const tag = this.#features.has(HELLO_FEATURE_CLOSE) ? EVENT_TAG.CLOSE : EVENT_TAG.STATE;
			this.#sendEventFrame(tag, { ns: namespace });
		}
		this.#channels.delete(namespace);
		this.#scheduleIdleClose();
	}

	#scheduleIdleClose() {
		clearTimeout(this.#idleTimer);
		if (!this.#channels.size && !this.#closed) {
			this.#idleTimer = setTimeout(() => {
				this.#idleTimer = null;
				if (!this.#channels.size && !this.#assetRequests.size) {
					this.close();
				} else {
					this.#scheduleIdleClose();
				}
			}, IDLE_CLOSE_MS);
		}
	}

	call(namespace, event, args, timeout) {
		return new Promise((resolve, reject) => {
			const cid = this.#nextCallId;
			this.#nextCallId = (this.#nextCallId + 1) >>> 0 || 1;
			const timer = setTimeout(() => {
				this.#pendingCalls.delete(cid);
				reject(new Error('operation has timed out'));
			}, timeout ?? CALL_TIMEOUT_MS);
			this.#pendingCalls.set(cid, { resolve, reject, timer });
			if (!this.#sendEventFrame(EVENT_TAG.CALL, { ns: namespace, cid, event, args, timeout })) {
				this.#pendingCalls.delete(cid);
				clearTimeout(timer);
				reject(new Error('Transport closed'));
			}
		});
	}

	#sendEventFrame(tag, body) {
		const frame = encodeEvent(tag, body);
		if (frame.length <= MAX_MESSAGE_SIZE) {
			return this.#send(this.#events, [frame]);
		}

		const cid = this.#nextContinuationId;
		this.#nextContinuationId = (this.#nextContinuationId + 1) >>> 0 || 1;
		return this.#send(this.#events, encodeContinuation(cid, frame));
	}

	#send(channel, frames) {
		if (!channel || channel.readyState !== 'open') {
			return false;
		}
		return this.#sendQueue?.enqueueMany(frames) ?? false;
	}

	#startHeartbeat() {
		if (this.#heartbeatTimer || !this.#features.has(HELLO_FEATURE_HEARTBEAT)) {
			return;
		}
		this.#lastInboundAt = Date.now();
		this.#heartbeatTimer = setInterval(() => {
			if (this.#closed) {
				return;
			}
			if (Date.now() - this.#lastInboundAt >= LIVENESS_TIMEOUT_MS) {
				this.#lose();
				return;
			}
			this.#sendEventFrame(EVENT_TAG.PING, {});
		}, HEARTBEAT_INTERVAL_MS);
	}

	#onEventMessage(data) {
		this.#lastInboundAt = Date.now();
		const frame = decodeEvent(data);
		if (!frame) {
			return;
		}
		if (frame.tag === EVENT_TAG.CONT) {
			this.#reassemble(frame);
			return;
		}

		this.#dispatchEvent(frame);
	}

	#reassemble(frame) {
		let pending = this.#continuations.get(frame.cid);
		if (!pending) {
			if (this.#continuations.size >= MAX_PENDING_CONTINUATIONS) {
				return;
			}
			pending = {
				parts: new Array(frame.total).fill(null),
				received: 0,
				bytes: 0,
				timer: setTimeout(() => { this.#continuations.delete(frame.cid); }, CONTINUATION_TIMEOUT_MS)
			};
			this.#continuations.set(frame.cid, pending);
		}
		if (pending.parts.length !== frame.total) {
			clearTimeout(pending.timer);
			this.#continuations.delete(frame.cid);
			return;
		}
		if (!pending.parts[frame.part]) {
			if (pending.bytes + frame.slice.length > MAX_CONTINUATION_BYTES) {
				clearTimeout(pending.timer);
				this.#continuations.delete(frame.cid);
				return;
			}
			pending.parts[frame.part] = frame.slice.slice();
			pending.received += 1;
			pending.bytes += frame.slice.length;
		}
		if (pending.received < frame.total) {
			return;
		}

		clearTimeout(pending.timer);
		this.#continuations.delete(frame.cid);
		const complete = decodeEvent(concat(pending.parts));
		if (complete && complete.tag !== EVENT_TAG.CONT) {
			this.#dispatchEvent(complete);
		}
	}

	#dispatchEvent(frame) {
		const body = frame.body ?? {};
		switch (frame.tag) {
			case EVENT_TAG.HELLO:
				if (frame.body?.v !== PROTOCOL_VERSION || frame.body?.ok === false) {
					this.#helloReject?.(new Error('Incompatible WebRTC protocol'));
				} else {
					this.#features = new Set(Array.isArray(frame.body?.features) ? frame.body.features : []);
					this.#startHeartbeat();
					this.#helloResolve?.();
				}
				this.#helloResolve = null;
				this.#helloReject = null;
				return;
			case EVENT_TAG.STATE:
				this.#channels.get(body.ns)?.setState(body);
				return;
			case EVENT_TAG.EVT:
				this.#channels.get(body.ns)?.dispatch(body.event, Array.isArray(body.args) ? body.args : []);
				return;
			case EVENT_TAG.REPLY: {
				const pending = this.#pendingCalls.get(body.cid);
				if (!pending) {
					return;
				}
				this.#pendingCalls.delete(body.cid);
				clearTimeout(pending.timer);
				if (body.error) {
					pending.reject(new Error(body.error.message || 'Request failed'));
					return;
				}
				pending.resolve(body.result);
				return;
			}
			default:
		}
	}

	#lose({ failed = true } = {}) {
		if (this.#closed) {
			return;
		}
		const handlers = [...this.#onLost];
		this.close({ failed });
		handlers.forEach((handler) => { handler(); });
	}

	close({ failed = false } = {}) {
		if (this.#closed) {
			return;
		}
		this.#closed = true;
		this.#state = 'CLOSING';
		if (this.#idleTimer) {
			clearTimeout(this.#idleTimer);
			this.#idleTimer = null;
		}
		if (this.#heartbeatTimer) {
			clearInterval(this.#heartbeatTimer);
			this.#heartbeatTimer = null;
		}
		transports.delete(this.#nodeId);
		if (failed) {
			cooldowns.set(this.#nodeId, Date.now() + RETRY_COOLDOWN_MS);
		}

		const helloReject = this.#helloReject;
		this.#helloResolve = null;
		this.#helloReject = null;
		helloReject?.(new Error('Transport closed'));

		for (const pending of this.#pendingCalls.values()) {
			clearTimeout(pending.timer);
			pending.reject(new Error('Transport closed'));
		}
		this.#pendingCalls.clear();
		for (const continuation of this.#continuations.values()) {
			clearTimeout(continuation.timer);
		}
		this.#continuations.clear();
		this.#pendingCandidates = [];
		this.#failAssetRequests('Transport closed');
		this.#sendQueue?.close();
		for (const channel of this.#channels.values()) {
			channel.close();
		}

		if (this.#signal?.connected && this.#sessionId) {
			this.#signal.emit('webrtc:close', { sessionId: this.#sessionId });
		}
		this.#signal?.disconnect();
		try {
			this.#assets?.close();
		} catch (error) {
			this.#assets = null;
		}
		try {
			this.#pc?.close();
		} catch (error) {
			this.#pc = null;
		}
		this.#state = 'CLOSED';
	}
}

const forNode = (nodeId) => {
	if (!nodeId || !isAvailable()) {
		return Promise.reject(new Error('WebRTC is unavailable'));
	}

	const cooldown = cooldowns.get(nodeId);
	if (cooldown && Date.now() < cooldown) {
		const error = new Error('WebRTC recently failed for this node');
		error.retryAfterMs = cooldown - Date.now();
		return Promise.reject(error);
	}

	let pending = transports.get(nodeId);
	if (!pending) {
		const transport = new WebrtcTransport(nodeId);
		pending = transport.start().catch((error) => {
			transport.close({ failed: true });
			error.retryAfterMs = RETRY_COOLDOWN_MS;
			throw error;
		});
		transports.set(nodeId, pending);
	}

	return pending;
};

const activeTransport = (nodeId) => {
	const pending = transports.get(nodeId);
	return (pending && typeof pending.then === 'function') ? pending : null;
};

export default { forNode, isAvailable, activeTransport };
export { forNode, isAvailable, activeTransport, NamespaceChannel, CONNECT_TIMEOUT_MS };
