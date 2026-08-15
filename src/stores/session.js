class Session {
	async login(data) {
		const response = await fetch('/session', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		const body = await response.json().catch(() => { return {}; });
		return {
			isAuthenticated: (body.isAuthenticated === true),
			message: body.message
		};
	}

	async logout() {
		const response = await fetch('/session', { method: 'DELETE' });
		const body = await response.json().catch(() => { return {}; });
		return {
			isEnded: response.ok,
			message: body.message
		};
	}
}

export default new Session();
