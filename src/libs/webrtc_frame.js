const EVENT_TAG = {
	HELLO: 0x10,
	OPEN: 0x11,
	STATE: 0x12,
	EVT: 0x13,
	CALL: 0x14,
	REPLY: 0x15,
	CONT: 0x1F
};

const HTTP_TAG = {
	REQ: 0x01,
	RESP: 0x02,
	CHUNK: 0x03,
	END: 0x04,
	ERR: 0x05,
	ABORT: 0x06
};

const MAX_MESSAGE_SIZE = 64 * 1024;
const CONT_HEADER_SIZE = 9;
const CONT_SLICE_SIZE = MAX_MESSAGE_SIZE - CONT_HEADER_SIZE;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const asBytes = (message) => {
	if (message instanceof ArrayBuffer) {
		return new Uint8Array(message);
	}
	if (ArrayBuffer.isView(message)) {
		return new Uint8Array(message.buffer, message.byteOffset, message.byteLength);
	}

	return encoder.encode(String(message ?? ''));
};

const concat = (parts) => {
	const total = parts.reduce((sum, part) => { return sum + part.length; }, 0);
	const result = new Uint8Array(total);
	let offset = 0;
	for (const part of parts) {
		result.set(part, offset);
		offset += part.length;
	}

	return result;
};

const encodeEvent = (tag, body) => {
	return concat([Uint8Array.of(tag), encoder.encode(JSON.stringify(body ?? {}))]);
};

const decodeEvent = (message) => {
	const bytes = asBytes(message);
	if (!bytes.length) {
		return null;
	}

	const tag = bytes[0];
	if (tag === EVENT_TAG.CONT) {
		if (bytes.length < CONT_HEADER_SIZE) {
			return null;
		}

		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		return {
			tag,
			cid: view.getUint32(1, true),
			part: view.getUint16(5, true),
			total: view.getUint16(7, true),
			slice: bytes.subarray(CONT_HEADER_SIZE)
		};
	}

	try {
		return { tag, body: JSON.parse(decoder.decode(bytes.subarray(1))) };
	} catch (error) {
		return null;
	}
};

const encodeContinuation = (cid, payload) => {
	const total = Math.max(1, Math.ceil(payload.length / CONT_SLICE_SIZE));
	const frames = [];
	for (let part = 0; part < total; part += 1) {
		const header = new Uint8Array(CONT_HEADER_SIZE);
		const view = new DataView(header.buffer);
		header[0] = EVENT_TAG.CONT;
		view.setUint32(1, cid, true);
		view.setUint16(5, part, true);
		view.setUint16(7, total, true);
		frames.push(concat([header, payload.subarray(part * CONT_SLICE_SIZE, (part + 1) * CONT_SLICE_SIZE)]));
	}

	return frames;
};

const encodeHttp = (tag, requestId, body) => {
	const header = new Uint8Array(5);
	const view = new DataView(header.buffer);
	header[0] = tag;
	view.setUint32(1, requestId >>> 0, true);
	if (body === undefined) {
		return header;
	}

	return concat([header, encoder.encode(JSON.stringify(body))]);
};

const decodeHttp = (message) => {
	const bytes = asBytes(message);
	if (bytes.length < 5) {
		return null;
	}

	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const tag = bytes[0];
	const requestId = view.getUint32(1, true);
	if (tag === HTTP_TAG.CHUNK) {
		if (bytes.length < 9) {
			return null;
		}

		return { tag, requestId, seq: view.getUint32(5, true), bytes: bytes.subarray(9) };
	}

	if (bytes.length === 5) {
		return { tag, requestId, body: {} };
	}

	try {
		return { tag, requestId, body: JSON.parse(decoder.decode(bytes.subarray(5))) };
	} catch (error) {
		return null;
	}
};

export {
	EVENT_TAG,
	HTTP_TAG,
	MAX_MESSAGE_SIZE,
	CONT_SLICE_SIZE,
	concat,
	encodeEvent,
	decodeEvent,
	encodeContinuation,
	encodeHttp,
	decodeHttp
};
