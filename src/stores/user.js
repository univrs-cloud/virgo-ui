import Store from 'stores/store';

class User extends Store {
	constructor() {
		const initialState = {
			users: null
		};
		super({
			namespace: 'user'
		});
		
		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			this.setState(initialState, 'socket_disconnect');
		});

		this.socket.on('users', (users) => {
			this.setState({ users }, 'get_users');
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
}

export default new User();
