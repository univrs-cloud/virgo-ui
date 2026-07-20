/**
 * Network layer for Web Push subscriptions against the fleet controller's `/push/*` HTTP endpoints.
 * A plain fetch client (not a socket store) like `stores/fleet_auth`; the subscribe/unsubscribe
 * endpoints derive identity from the authenticated session, so no user id is sent from the client.
 */
class FleetPush {
	async #post(url, data) {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: data === undefined ? undefined : JSON.stringify(data)
		});
		return response.json().catch(() => ({}));
	}

	// The VAPID public key the browser subscribes with, or null when push isn't configured server-side.
	async getVapidPublicKey() {
		const response = await fetch('/push/vapid-public-key');
		if (!response.ok) {
			return null;
		}
		const data = await response.json().catch(() => ({}));
		return data?.publicKey || null;
	}

	subscribe(subscription) {
		return this.#post('/push/subscribe', subscription);
	}

	unsubscribe(endpoint) {
		return this.#post('/push/unsubscribe', { endpoint });
	}
}

export default new FleetPush();
