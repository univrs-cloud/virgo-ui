import { io } from 'socket.io-client';

const RESERVED_EVENTS = ['connect', 'disconnect', 'connect_error'];

class SocketTransport {
	#io;
	#rtc = null;
	#listeners = new Map();
	#bound = null;
	#anyHandler;
	#reservedHandlers = new Map();

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

	timeout(ms) {
		const target = this.#target;
		return {
			emitWithAck: (event, ...args) => {
				return target.timeout(ms).emitWithAck(event, ...args);
			}
		};
	}

	connect() {
		if (!this.#rtc) {
			this.#io.connect();
		}
		return this;
	}

	disconnect() {
		if (this.#rtc) {
			this.#rtc.close();
			return this;
		}
		this.#io.disconnect();
		return this;
	}

	useWebrtc(channel) {
		if (this.#rtc === channel) {
			return;
		}

		this.#unbind();
		this.#rtc = channel;
		this.#bind(channel);
		this.#io.disconnect();
		if (channel.connected) {
			this.#dispatch('connect', []);
		}
	}

	useSocketIo() {
		if (!this.#rtc) {
			return;
		}

		this.#unbind();
		this.#rtc = null;
		this.#bind(this.#io);
		this.#io.connect();
	}
}

export default SocketTransport;
