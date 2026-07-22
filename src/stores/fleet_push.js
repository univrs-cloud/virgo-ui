import * as request from 'stores/request';

/**
 * Network layer for Web Push subscriptions against the fleet controller's `/push/*` HTTP endpoints.
 * A plain fetch client (not a socket store) like `stores/fleet_auth`; the subscribe/unsubscribe
 * endpoints derive identity from the authenticated session, so no user id is sent from the client.
 */
class FleetPush {
	// The VAPID public key the browser subscribes with, or null when push isn't configured server-side.
	async getVapidPublicKey() {
		const data = await request.get('/push/vapid-public-key');
		return data?.publicKey || null;
	}

	// Account-wide on: registers this device's subscription and sets the preference server-side.
	enable(subscription) {
		return request.post('/push/enable', subscription);
	}

	// Account-wide off: clears the preference and drops every device's subscription server-side.
	disable() {
		return request.post('/push/disable');
	}
}

export default new FleetPush();
