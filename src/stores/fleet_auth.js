class FleetAuth {
	async #post(url, data) {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: data === undefined ? undefined : JSON.stringify(data)
		});
		// Every /auth/* endpoint answers with the same { status, message } shape as the socket acks
		// (a failed HTTP status still carries status: 'failed'), so callers check `status` uniformly.
		return response.json().catch(() => ({}));
	}

	login(config) {
		return this.#post('/auth/login', config);
	}

	signup(config) {
		return this.#post('/auth/signup', config);
	}

	logout() {
		return this.#post('/auth/logout');
	}

	changePassword(config) {
		return this.#post('/auth/password', config);
	}
}

export default new FleetAuth();
