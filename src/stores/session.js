/**
 * The node's own session endpoints. They carry credentials to Authelia and its cookies back, so the
 * only thing that ever reaches this browser is the cookie Authelia issued — nothing here reads it,
 * since it is set for the node's name and marked http-only. Both answers are the status alone.
 */
class Session {
	async login(data) {
		const response = await fetch('/session', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		return response.ok;
	}

	async logout() {
		const response = await fetch('/session', { method: 'DELETE' });
		return response.ok;
	}
}

export default new Session();
