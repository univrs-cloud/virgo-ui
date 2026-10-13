import Store from 'stores/store';

class User extends Store {
	constructor() {
		const initialState = {
			users: null,
			sessions: null,
			role: null
		};
		super({
			namespace: 'user'
		});
		
		this.setState(initialState, 'socket_connect');

		this.socket.on('users', (users) => {
			this.setState({ users }, 'get_users');
		});

		this.socket.on('user:sessions', (sessions) => {
			this.setState({ sessions }, 'get_sessions');
		});

		this.socket.on('user:role', (role) => {
			this.setState({ role }, 'get_role');
		});
	}

	getUsers() {
		return this.getStateProperty('users');
	}

	createUser(data) {
		this.socket.emit('user:create', data);
	}

	updateUser(data) {
		this.socket.emit('user:update', data);
	}

	deleteUser(data) {
		this.socket.emit('user:delete', data);
	}

	lockUser(data) {
		this.socket.emit('user:lock', data);
	}

	unlockUser(data) {
		this.socket.emit('user:unlock', data);
	}

	changePassword(data) {
		this.socket.emit('user:password', data);
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

	revokeAllSessions(data) {
		return this.socket.timeout(10000).emitWithAck('user:sessions:revoke-all', data);
	}
}

export default new User();
