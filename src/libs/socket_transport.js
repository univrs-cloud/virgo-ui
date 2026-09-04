import { io } from 'socket.io-client';

const RESERVED_EVENTS = ['connect', 'disconnect', 'connect_error'];
const ENGINE_DRAIN_TIMEOUT_MS = 1500;
const MIN_DRAIN_GRACE_MS = 100;

class SocketTransport {
	#io;
	#rtc = null;
	#listeners = new Map();
	#bound = null;
	#anyHandler;
	#reservedHandlers = new Map();
	#pendingSocketIoCalls = new Set();
	#switchGeneration = 0;
	#state = 'SOCKET_IO';

	constructor(namespace, options) {
		this.#anyHandler = (event, ...args) => { this.#dispatch(event, args); };
		RESERVED_EVENTS.forEach((event) => {
			this.#reservedHandlers.set(event, (...args) => { this.#dispatch(event, args); });
		});
		this.#io = io(namespace, options);
		this.#bind(this.#io);
	}

	get connected() {
		return Boolean(this.#target.connected);
	}

	get usingWebrtc() {
		return this.#rtc !== null;
	}

	get state() {
		return this.#state;
	}

	get socketIoConnected() {
		return Boolean(this.#io.connected);
	}

	get #target() {
		return this.#rtc ?? this.#io;
	}

	#bind(target) {
		target.onAny(this.#anyHandler);
		RESERVED_EVENTS.forEach((event) => {
			target.on(event, this.#reservedHandlers.get(event));
		});
		this.#bound = target;
	}

	#unbind() {
		const target = this.#bound;
		if (!target) {
			return;
		}
		target.offAny(this.#anyHandler);
		RESERVED_EVENTS.forEach((event) => {
			target.off(event, this.#reservedHandlers.get(event));
		});
		this.#bound = null;
	}

	#dispatch(event, args) {
		for (const handler of [...(this.#listeners.get(event) ?? [])]) {
			handler(...args);
		}
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

	emit(event, ...args) {
		this.#target.emit(event, ...args);
		return this;
	}

	#trackSocketIoCall(promise) {
		this.#pendingSocketIoCalls.add(promise);
		promise.finally(() => { this.#pendingSocketIoCalls.delete(promise); }).catch(() => {});
		return promise;
	}

	timeout(ms) {
		const target = this.#target;
		return {
			emitWithAck: (event, ...args) => {
				const pending = target.timeout(ms).emitWithAck(event, ...args);
				return target === this.#io ? this.#trackSocketIoCall(pending) : pending;
			}
		};
	}

	whenSocketIoConnected(timeoutMs) {
		if (this.#io.connected) {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			const cleanup = () => {
				clearTimeout(timer);
				this.#io.off('connect', onConnect);
			};
			const onConnect = () => {
				cleanup();
				resolve();
			};
			const timer = setTimeout(() => {
				cleanup();
				reject(new Error('Socket.IO proxy timed out'));
			}, timeoutMs);
			this.#io.once('connect', onConnect);
		});
	}

	connect() {
		if (!this.#rtc) {
			this.#state = 'SOCKET_IO';
			this.#io.connect();
		}
		return this;
	}

	disconnect() {
		this.#switchGeneration += 1;
		this.#revert();
		this.#io.disconnect();
		this.#state = 'CLOSED';
		return this;
	}

	async useWebrtc(channel, timeoutMs) {
		if (this.#rtc === channel) {
			return;
		}

		const generation = ++this.#switchGeneration;
		this.#state = 'SWITCHING';
		try {
			await channel.activate(timeoutMs);
		} catch (error) {
			if (this.#switchGeneration === generation && this.#state === 'SWITCHING') {
				this.#state = this.#rtc ? 'WEBRTC' : 'SOCKET_IO';
			}
			throw error;
		}
		if (this.#switchGeneration !== generation || this.#state === 'CLOSED') {
			throw new Error('WebRTC activation was cancelled');
		}
		if (!channel.connected) {
			this.#state = 'SOCKET_IO';
			throw new Error('WebRTC namespace closed during activation');
		}

		this.#unbind();
		this.#rtc = channel;
		this.#bind(channel);
		this.#state = 'WEBRTC';
		if (channel.connected) {
			this.#dispatch('connect', []);
		}
		this.#drainSocketIo(generation);
	}

	async #drainSocketIo(generation) {
		const calls = [...this.#pendingSocketIoCalls];
		await new Promise((resolve) => { setTimeout(resolve, MIN_DRAIN_GRACE_MS); });
		if (calls.length) {
			// Each call already owns its caller-selected acknowledgement timeout. Keeping the old path
			// alive through that bound preserves its result without allowing new work onto it.
			await Promise.allSettled(calls);
		}
		await this.#waitForEngineDrain();
		if (this.#switchGeneration === generation && this.#rtc) {
			this.#io.disconnect();
		}
	}

	#waitForEngineDrain() {
		const engine = this.#io.io?.engine;
		if (!engine || !engine.writeBuffer?.length) {
			return Promise.resolve();
		}
		return new Promise((resolve) => {
			let settled = false;
			const finish = () => {
				if (settled) {
					return;
				}
				settled = true;
				clearTimeout(timer);
				engine.off?.('drain', finish);
				resolve();
			};
			const timer = setTimeout(finish, ENGINE_DRAIN_TIMEOUT_MS);
			engine.once?.('drain', finish);
		});
	}

	#revert() {
		if (!this.#rtc) {
			return;
		}

		const channel = this.#rtc;
		this.#unbind();
		this.#rtc = null;
		this.#bind(this.#io);
		this.#state = 'SOCKET_IO';
		channel.close({ notify: true });
	}

	useSocketIo() {
		if (!this.#rtc) {
			return;
		}

		this.#switchGeneration += 1;
		this.#revert();
		if (this.#io.connected) {
			this.#io.disconnect();
		}
		this.#io.connect();
	}
}

export default SocketTransport;
