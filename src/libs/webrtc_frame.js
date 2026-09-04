const EVENT_TAG = {
	HELLO: 0x10,
	OPEN: 0x11,
	STATE: 0x12,
	EVT: 0x13,
	CALL: 0x14,
	REPLY: 0x15,
	ACTIVATE: 0x16,
	CLOSE: 0x17,
	PING: 0x18,
	PONG: 0x19,
	CONT: 0x1F
};

const ASSET_TAG = {
	REQ: 0x20,
	RES: 0x21,
	CHUNK: 0x22,
	END: 0x23,
	ERR: 0x24,
	ABORT: 0x25,
	CREDIT: 0x26
};

const MAX_MESSAGE_SIZE = 64 * 1024;
const CONT_HEADER_SIZE = 9;
const CONT_SLICE_SIZE = MAX_MESSAGE_SIZE - CONT_HEADER_SIZE;
const MAX_CONTINUATION_PARTS = 256;
const ASSET_HEADER_SIZE = 5;
const ASSET_CHUNK_HEADER_SIZE = 9;
const ASSET_CHUNK_SIZE = MAX_MESSAGE_SIZE - ASSET_CHUNK_HEADER_SIZE;
const ASSET_TAGS = new Set(Object.values(ASSET_TAG));

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
		const part = view.getUint16(5, true);
		const total = view.getUint16(7, true);
		if (!total || total > MAX_CONTINUATION_PARTS || part >= total) {
			return null;
		}

		return {
			tag,
			cid: view.getUint32(1, true),
			part,
			total,
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

const encodeAssetControl = (tag, requestId, body) => {
	const header = new Uint8Array(ASSET_HEADER_SIZE);
	header[0] = tag;
	new DataView(header.buffer).setUint32(1, requestId, true);
	return concat([header, encoder.encode(JSON.stringify(body ?? {}))]);
};

const decodeAssetFrame = (message) => {
	const bytes = asBytes(message);
	if (!bytes.length || !ASSET_TAGS.has(bytes[0])) {
		return null;
	}

	const tag = bytes[0];
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (tag === ASSET_TAG.CHUNK) {
		if (bytes.length < ASSET_CHUNK_HEADER_SIZE) {
			return null;
		}
		return {
			tag,
			requestId: view.getUint32(1, true),
			seq: view.getUint32(5, true),
			bytes: bytes.subarray(ASSET_CHUNK_HEADER_SIZE)
		};
	}

	if (bytes.length < ASSET_HEADER_SIZE) {
		return null;
	}
	try {
		const json = decoder.decode(bytes.subarray(ASSET_HEADER_SIZE));
		return {
			tag,
			requestId: view.getUint32(1, true),
			body: json ? JSON.parse(json) : {}
		};
	} catch (error) {
		return null;
	}
};

export {
	EVENT_TAG,
	ASSET_TAG,
	ASSET_CHUNK_SIZE,
	MAX_MESSAGE_SIZE,
	CONT_SLICE_SIZE,
	MAX_CONTINUATION_PARTS,
	concat,
	encodeEvent,
	decodeEvent,
	encodeContinuation,
	encodeAssetControl,
	decodeAssetFrame
};
