const DEFAULT_HIGH_WATER_MARK = 1024 * 1024;
const DEFAULT_LOW_WATER_MARK = 256 * 1024;
const DEFAULT_MAX_BUFFERED_BYTES = 8 * 1024 * 1024;

/**
 * Bounded, ordered writer for a browser RTCDataChannel. `send()` only transfers ownership to the
 * browser's native buffer; it does not mean the bytes have left the machine, so writers must also
 * honour `bufferedAmount` before accepting an unbounded application burst.
 */
class DataChannelSendQueue {
	#channel;
	#queue = [];
	#queuedBytes = 0;
	#closed = false;
	#draining = false;
	#highWaterMark;
	#maxBufferedBytes;
	#onFailure;

	constructor(channel, {
		highWaterMark = DEFAULT_HIGH_WATER_MARK,
		lowWaterMark = DEFAULT_LOW_WATER_MARK,
		maxBufferedBytes = DEFAULT_MAX_BUFFERED_BYTES,
		onFailure = () => {}
	} = {}) {
		this.#channel = channel;
		this.#highWaterMark = highWaterMark;
		this.#maxBufferedBytes = maxBufferedBytes;
		this.#onFailure = onFailure;
		channel.bufferedAmountLowThreshold = lowWaterMark;
		channel.addEventListener('bufferedamountlow', () => { this.#drain(); });
	}

	#byteLength(bytes) {
		return bytes?.byteLength ?? bytes?.length ?? 0;
	}

	enqueue(bytes) {
		return this.enqueueMany([bytes]);
	}

	enqueueMany(frames) {
		if (this.#closed || this.#channel.readyState !== 'open') {
			return false;
		}

		const additions = frames.map((bytes) => {
			return { bytes, length: this.#byteLength(bytes) };
		});
		const addedBytes = additions.reduce((total, entry) => { return total + entry.length; }, 0);
		const nativeBytes = Number(this.#channel.bufferedAmount) || 0;
		if (nativeBytes + this.#queuedBytes + addedBytes > this.#maxBufferedBytes) {
			const error = new Error('WebRTC send queue exceeded its memory limit');
			error.overflow = true;
			this.#fail(error);
			return false;
		}

		this.#queue.push(...additions);
		this.#queuedBytes += addedBytes;
		this.#drain();
		return true;
	}

	#drain() {
		if (this.#closed || this.#draining || this.#channel.readyState !== 'open') {
			return;
		}
		this.#draining = true;
		try {
			while (this.#queue.length && this.#channel.bufferedAmount < this.#highWaterMark) {
				const entry = this.#queue.shift();
				this.#queuedBytes -= entry.length;
				this.#channel.send(entry.bytes);
			}
		} catch (error) {
			this.#fail(error);
		} finally {
			this.#draining = false;
		}
	}

	#fail(error) {
		if (this.#closed) {
			return;
		}
		this.close();
		this.#onFailure(error);
	}

	close() {
		this.#closed = true;
		this.#queue = [];
		this.#queuedBytes = 0;
	}
}

export default DataChannelSendQueue;
export {
	DEFAULT_HIGH_WATER_MARK,
	DEFAULT_LOW_WATER_MARK,
	DEFAULT_MAX_BUFFERED_BYTES
};
