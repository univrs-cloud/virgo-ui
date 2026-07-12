import Store from 'stores/store';

/**
 * Self-service actions for the logged-in fleet account over the fleet controller's `/user` socket.
 * Kept separate from `stores/user.js` (node users, virgo-api). The fleet `/user` namespace exposes
 * no list of users — this store only issues self-targeted actions; the server derives identity from
 * the authenticated session, so no user id/email needs to be trusted from the client.
 */
class FleetUser extends Store {
	constructor() {
		super({
			namespace: 'user'
		});
	}

	updateUser(config) {
		return this.socket.timeout(10000).emitWithAck('user:update', config);
	}
}

export default new FleetUser();
