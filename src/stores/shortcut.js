import Store from 'stores/store';

class Shortcut extends Store {
	constructor() {
		const initialState = {};
		super({
			namespace: 'shortcut'
		});

		this.setState(initialState, 'socket_connect');
	}

	getConfigured() {
		return this.getStateProperty('configured');
	}

	createShortcut(data) {
		this.socket.emit('shortcut:create', data);
	}

	updateShortcut(data) {
		this.socket.emit('shortcut:update', data);
	}

	deleteShortcut(data) {
		this.socket.emit('shortcut:delete', data);
	}
}

export default new Shortcut();
