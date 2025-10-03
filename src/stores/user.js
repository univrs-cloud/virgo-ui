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
			if (this.getStateProperty('configuringNetworkInterface')) {
				return;
			}
			
			if (this.getStateProperty('reboot') || this.getStateProperty('shutdown') || !_.isNull(this.getStateProperty('upgrade'))) {
				return;
			}

			_.each(_.keys(initialState), (key) => { initialState[key] = false; });
			this.setState(initialState, 'socket_disconnect');
			_.each(_.keys(initialState), (key) => { initialState[key] = null; });
		
		});

		this.socket.on('users', (users) => {
			this.setState({ users }, 'get_users');
		});
	}

	getUsers() {
		return this.getStateProperty('users');
	}

	createUser(config) {
		this.socket.emit('user:create', config);
	}

	updateUser(config) {
		this.socket.emit('user:update', config);
	}

	deleteUser(config) {
		this.socket.emit('user:delete', config);
	}

	lockUser(config) {
		this.socket.emit('user:lock', config);
	}

	unlockUser(config) {
		this.socket.emit('user:unlock', config);
	}

	changePassword(config) {
		this.socket.emit('user:password', config);
	}
}

export default new User();
