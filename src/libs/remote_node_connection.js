import SocketTransport from 'libs/socket_transport';
import { forNode, isAvailable, CONNECT_TIMEOUT_MS } from 'libs/webrtc_transport';

const PREPARE_BUDGET_MS = 5000;
const ACTIVATE_BUDGET_MS = 5000;
const UPGRADE_DEADLINE_MS = CONNECT_TIMEOUT_MS + PREPARE_BUDGET_MS + ACTIVATE_BUDGET_MS;

const remaining = (deadline) => {
	return Math.max(0, deadline - Date.now());
};

const nextTask = () => {
	return new Promise((resolve) => { setTimeout(resolve, 0); });
};

/**
 * The UI-facing connection. It starts on the Fleet Socket.IO proxy and privately prepares a
 * WebRTC namespace. The fallback must establish first so its initial state snapshot is delivered;
 * only then is the prepared namespace activated and made the single event source.
 */
class RemoteNodeConnection {
	#connection;
	#nodeId;
	#namespace;

	constructor(fallbackNamespace, options, { nodeId = null, namespace = null } = {}) {
		this.#connection = new SocketTransport(fallbackNamespace, options);
		this.#nodeId = nodeId;
		this.#namespace = namespace;
		if (nodeId && namespace && isAvailable()) {
			this.#upgrade().catch(() => {});
		}
	}

	get connected() {
		return this.#connection.connected;
	}

	get transport() {
		return this.#connection.state;
	}

	async #upgrade() {
		const deadline = Date.now() + UPGRADE_DEADLINE_MS;
		const transport = await Promise.race([
			forNode(this.#nodeId),
			new Promise((resolve, reject) => {
				setTimeout(() => { reject(new Error('WebRTC upgrade deadline exceeded')); }, remaining(deadline));
			})
		]);
		const channel = transport.channel(this.#namespace);
		let unsubscribeLost = null;
		let unsubscribeChannelLost = null;
		try {
			await Promise.all([
				channel.whenPrepared(remaining(deadline)),
				this.#connection.whenSocketIoConnected(remaining(deadline))
			]);
			// Let Socket.IO deliver packets queued with its connect packet before suppressing that path.
			await nextTask();
			if (remaining(deadline) <= 0) {
				throw new Error('WebRTC upgrade deadline exceeded');
			}
			unsubscribeLost = transport.onLost(() => { this.#connection.useSocketIo(); });
			unsubscribeChannelLost = channel.onLost(() => { this.#connection.useSocketIo(); });
			await this.#connection.useWebrtc(channel, remaining(deadline));
		} catch (error) {
			unsubscribeLost?.();
			unsubscribeChannelLost?.();
			channel.close({ notify: true });
			throw error;
		}
	}

	on(event, handler) {
		this.#connection.on(event, handler);
		return this;
	}

	off(event, handler) {
		this.#connection.off(event, handler);
		return this;
	}

	once(event, handler) {
		this.#connection.once(event, handler);
		return this;
	}

	emit(event, ...args) {
		this.#connection.emit(event, ...args);
		return this;
	}

	call(event, args = [], timeoutMs = 30000) {
		return this.#connection.timeout(timeoutMs).emitWithAck(event, ...args);
	}

	timeout(ms) {
		return this.#connection.timeout(ms);
	}

	connect() {
		this.#connection.connect();
		return this;
	}

	disconnect() {
		this.#connection.disconnect();
		return this;
	}

	close() {
		return this.disconnect();
	}
}

export default RemoteNodeConnection;
export { UPGRADE_DEADLINE_MS };
