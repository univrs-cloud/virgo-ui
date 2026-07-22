/**
 * Shared fetch client for the fleet controller's HTTP endpoints.
 *
 * The write verbs target the ack-shaped endpoints: every /auth/* and /push/* route answers with the
 * same { status, message } shape as the socket acks (a failed HTTP status still carries
 * status: 'failed'), so callers check `status` uniformly and never inspect response.ok.
 */
const send = async (method, url, data) => {
	const response = await fetch(url, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: data === undefined ? undefined : JSON.stringify(data)
	});
	return response.json().catch(() => ({}));
};

// Plain JSON reads, which carry no ack envelope of their own: null when the read fails.
const get = async (url) => {
	const response = await fetch(url);
	if (!response.ok) {
		return null;
	}
	return response.json().catch(() => null);
};

// HEAD carries no body, so there is nothing to parse: callers get the status and headers to probe
// with (existence checks, Content-Length, ETag).
const head = async (url) => {
	const response = await fetch(url, { method: 'HEAD' });
	return {
		ok: response.ok,
		status: response.status,
		headers: response.headers
	};
};

const post = (url, data) => {
	return send('POST', url, data);
};

const put = (url, data) => {
	return send('PUT', url, data);
};

const patch = (url, data) => {
	return send('PATCH', url, data);
};

const del = (url, data) => {
	return send('DELETE', url, data);
};

export {
	get,
	head,
	post,
	put,
	patch,
	del as delete
};
