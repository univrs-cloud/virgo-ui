import { io } from 'socket.io-client';
import {
	EVENT_TAG,
	MAX_MESSAGE_SIZE,
	concat,
	encodeEvent,
	decodeEvent,
	encodeContinuation
} from 'libs/webrtc_frame';

const CONNECT_TIMEOUT_MS = 8000;
const SESSION_REQUEST_TIMEOUT_MS = 10000;
const CALL_TIMEOUT_MS = 30000;
const PROTOCOL_VERSION = 1;
const RETRY_COOLDOWN_MS = 60000;
const MAX_PENDING_CONTINUATIONS = 8;

const transports = new Map();
const cooldowns = new Map();

const isAvailable = () => {
	return typeof RTCPeerConnection === 'function' && typeof RTCPeerConnection.prototype?.createDataChannel === 'function';
};

class NamespaceChannel {
	#transport;
	#namespace;
	#listeners = new Map();
	#anyListeners = new Set();
	#connected = false;
	#closed = false;
	#waiters = new Set();

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

	setConnected(connected) {
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
		if (notify) {
			this.#transport.closeNamespace(this.#namespace);
		}
		this.setConnected(false);
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
	#channels = new Map();
	#pendingCalls = new Map();
	#continuations = new Map();
	#nextCallId = 1;
	#nextContinuationId = 1;
	#closed = false;
	#onLost = new Set();
	#helloResolve = null;

	constructor(nodeId) {
		this.#nodeId = nodeId;
	}

	get nodeId() {
		return this.#nodeId;
	}

	get connected() {
		return !this.#closed && this.#events?.readyState === 'open';
	}

	onLost(handler) {
		this.#onLost.add(handler);
		return () => { this.#onLost.delete(handler); };
	}

	async start() {
		this.#signal = io(`/fleet/${this.#nodeId}/signal`, {
			path: '/api',
			reconnection: false
		});

		const ack = await this.#requestSession();
		this.#sessionId = ack.sessionId;
		this.#token = ack.token;

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
				this.#pc.setRemoteDescription({ type: 'answer', sdp }).catch(() => { this.#lose(); });
			}
		});
		this.#signal.on('webrtc:candidate', ({ sessionId, candidate } = {}) => {
			if (sessionId === this.#sessionId && candidate) {
				this.#pc?.addIceCandidate(candidate).catch(() => {});
			}
		});
		this.#signal.on('webrtc:close', () => { this.#lose(); });
		this.#signal.on('webrtc:error', () => { this.#lose(); });
		this.#signal.on('disconnect', () => { this.#lose(); });

		this.#events = this.#pc.createDataChannel('events', { ordered: true });
		this.#events.binaryType = 'arraybuffer';
		this.#events.onmessage = ({ data }) => { this.#onEventMessage(data); };
		this.#events.onclose = () => { this.#lose(); };

		const offer = await this.#pc.createOffer();
		await this.#pc.setLocalDescription(offer);
		this.#signal.emit('webrtc:offer', { sessionId: this.#sessionId, sdp: offer.sdp, token: this.#token });

		await this.#waitForHello();
		return this;
	}

	#requestSession() {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => { reject(new Error('Signaling timed out')); }, SESSION_REQUEST_TIMEOUT_MS);
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

	#waitForHello() {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => { reject(new Error('Data channel timed out')); }, CONNECT_TIMEOUT_MS);
			this.#helloResolve = () => {
				clearTimeout(timer);
				resolve();
			};
			this.#events.onopen = () => {
				this.#send(this.#events, encodeEvent(EVENT_TAG.HELLO, { v: PROTOCOL_VERSION }));
			};
			if (this.#events.readyState === 'open') {
				this.#send(this.#events, encodeEvent(EVENT_TAG.HELLO, { v: PROTOCOL_VERSION }));
			}
		});
	}

	channel(namespace) {
		let channel = this.#channels.get(namespace);
		if (!channel) {
			channel = new NamespaceChannel(this, namespace);
			this.#channels.set(namespace, channel);
		}
		this.#send(this.#events, encodeEvent(EVENT_TAG.OPEN, { ns: namespace }));
		return channel;
	}

	sendEvent(namespace, event, args) {
		this.#sendEventFrame(EVENT_TAG.EVT, { ns: namespace, event, args });
	}

	closeNamespace(namespace) {
		if (this.connected) {
			this.#sendEventFrame(EVENT_TAG.STATE, { ns: namespace });
		}
		this.#channels.delete(namespace);
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
			this.#sendEventFrame(EVENT_TAG.CALL, { ns: namespace, cid, event, args, timeout });
		});
	}

	#sendEventFrame(tag, body) {
		const frame = encodeEvent(tag, body);
		if (frame.length <= MAX_MESSAGE_SIZE) {
			this.#send(this.#events, frame);
			return;
		}

		const cid = this.#nextContinuationId;
		this.#nextContinuationId = (this.#nextContinuationId + 1) >>> 0 || 1;
		for (const slice of encodeContinuation(cid, frame)) {
			this.#send(this.#events, slice);
		}
	}

	#send(channel, bytes) {
		if (!channel || channel.readyState !== 'open') {
			return false;
		}

		try {
			channel.send(bytes);
			return true;
		} catch (error) {
			return false;
		}
	}

	#onEventMessage(data) {
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
			pending = { parts: new Array(frame.total).fill(null), received: 0 };
			this.#continuations.set(frame.cid, pending);
		}
		if (pending.parts.length !== frame.total) {
			this.#continuations.delete(frame.cid);
			return;
		}
		if (!pending.parts[frame.part]) {
			pending.parts[frame.part] = frame.slice.slice();
			pending.received += 1;
		}
		if (pending.received < frame.total) {
			return;
		}

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
				this.#helloResolve?.();
				this.#helloResolve = null;
				return;
			case EVENT_TAG.STATE:
				this.#channels.get(body.ns)?.setConnected(Boolean(body.ok));
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

	#lose() {
		if (this.#closed) {
			return;
		}
		const handlers = [...this.#onLost];
		this.close({ failed: true });
		handlers.forEach((handler) => { handler(); });
	}

	close({ failed = false } = {}) {
		if (this.#closed) {
			return;
		}
		this.#closed = true;
		transports.delete(this.#nodeId);
		if (failed) {
			cooldowns.set(this.#nodeId, Date.now() + RETRY_COOLDOWN_MS);
		}

		for (const pending of this.#pendingCalls.values()) {
			clearTimeout(pending.timer);
			pending.reject(new Error('Transport closed'));
		}
		this.#pendingCalls.clear();
		this.#continuations.clear();
		for (const channel of this.#channels.values()) {
			channel.close();
		}

		if (this.#signal?.connected && this.#sessionId) {
			this.#signal.emit('webrtc:close', { sessionId: this.#sessionId });
		}
		this.#signal?.disconnect();
		try {
			this.#pc?.close();
		} catch (error) {
			this.#pc = null;
		}
	}
}

const forNode = (nodeId) => {
	if (!nodeId || !isAvailable()) {
		return Promise.reject(new Error('WebRTC is unavailable'));
	}

	const cooldown = cooldowns.get(nodeId);
	if (cooldown && Date.now() < cooldown) {
		return Promise.reject(new Error('WebRTC recently failed for this node'));
	}

	let pending = transports.get(nodeId);
	if (!pending) {
		const transport = new WebrtcTransport(nodeId);
		pending = transport.start().catch((error) => {
			transport.close({ failed: true });
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
export { forNode, isAvailable, activeTransport, NamespaceChannel };
