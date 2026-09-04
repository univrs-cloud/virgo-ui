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
	#closed = false;
	#generation = 0;
	#retryTimer = null;
	#retryDelay = 5000;
	#upgrading = false;
	#unsubscribeLost = null;
	#unsubscribeChannelLost = null;

	constructor(fallbackNamespace, options, { nodeId = null, namespace = null } = {}) {
		this.#connection = new SocketTransport(fallbackNamespace, options);
		this.#nodeId = nodeId;
		this.#namespace = namespace;
		this.#scheduleUpgrade(0);
	}

	get connected() {
		return this.#connection.connected;
	}

	get transport() {
		return this.#connection.state;
	}

	#clearLostListeners() {
		this.#unsubscribeLost?.();
		this.#unsubscribeChannelLost?.();
		this.#unsubscribeLost = null;
		this.#unsubscribeChannelLost = null;
	}

	#scheduleUpgrade(delay = this.#retryDelay) {
		if (this.#closed || this.#upgrading || this.#retryTimer !== null || this.#connection.usingWebrtc ||
			!this.#nodeId || !this.#namespace || !isAvailable()) {
			return;
		}
		this.#retryTimer = setTimeout(async () => {
			this.#retryTimer = null;
			this.#upgrading = true;
			const generation = this.#generation;
			let retryAfter = 0;
			try {
				await this.#upgrade(generation);
				this.#retryDelay = 5000;
			} catch (error) {
				retryAfter = error.retryAfterMs || 0;
			} finally {
				this.#upgrading = false;
				if (!this.#closed && !this.#connection.usingWebrtc) {
					this.#scheduleUpgrade(Math.max(this.#retryDelay, retryAfter));
					this.#retryDelay = Math.min(this.#retryDelay * 2, 60000);
				}
			}
		}, delay);
	}

	async #upgrade(generation) {
		const deadline = Date.now() + UPGRADE_DEADLINE_MS;
		const transport = await forNode(this.#nodeId);
		if (this.#closed || generation !== this.#generation) {
			throw new Error('WebRTC upgrade was cancelled');
		}
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
			if (this.#closed || generation !== this.#generation || remaining(deadline) <= 0) {
				throw new Error('WebRTC upgrade deadline exceeded');
			}
			const lost = () => {
				this.#clearLostListeners();
				if (!this.#closed && generation === this.#generation) {
					this.#connection.useSocketIo();
					this.#scheduleUpgrade();
				}
			};
			unsubscribeLost = this.#unsubscribeLost = transport.onLost(lost);
			unsubscribeChannelLost = this.#unsubscribeChannelLost = channel.onLost(lost);
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
		this.#closed = false;
		this.#connection.connect();
		this.#scheduleUpgrade(0);
		return this;
	}

	disconnect() {
		this.#closed = true;
		this.#generation += 1;
		clearTimeout(this.#retryTimer);
		this.#retryTimer = null;
		this.#clearLostListeners();
		this.#connection.disconnect();
		return this;
	}

	close() {
		return this.disconnect();
	}
}

export default RemoteNodeConnection;
export { UPGRADE_DEADLINE_MS };
