import Store from 'stores/store';

/**
 * Self-service actions for the logged-in fleet account over the fleet controller's `/user` socket.
 * Kept separate from `stores/user.js` (node users, virgo-api). The fleet `/user` namespace exposes
 * no list of users — this store only issues self-targeted actions; the server derives identity from
 * the authenticated session, so no user id/email needs to be trusted from the client.
 */
class FleetUser extends Store {
	constructor() {
		const initialState = {
			sessions: null
		};

		super({
			namespace: 'user'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			this.setState(initialState, 'socket_disconnect');
		});

		// Pushed on connect and again after any revoke, so a session ended from another tab or
		// device disappears here without a reload.
		this.socket.on('user:sessions', (sessions) => {
			this.setState({ sessions }, 'get_sessions');
		});
	}

	updateUser(data) {
		return this.socket.timeout(10000).emitWithAck('user:update', data);
	}

	getSessions() {
		return this.getStateProperty('sessions');
	}

	listSessions() {
		return this.socket.timeout(10000).emitWithAck('user:sessions:list', {});
	}

	revokeSession(data) {
		return this.socket.timeout(10000).emitWithAck('user:sessions:revoke', data);
	}

	revokeOtherSessions() {
		return this.socket.timeout(10000).emitWithAck('user:sessions:revoke-others', {});
	}
}

export default new FleetUser();
