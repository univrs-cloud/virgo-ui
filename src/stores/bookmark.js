import Store from 'stores/store';

class Bookmark extends Store {
	constructor() {
		const initialState = {};
		super({
			namespace: 'bookmark'
		});

		this.setState(initialState, 'socket_connect');
	}

	getConfigured() {
		return this.getStateProperty('configured');
	}

	createBookmark(config) {
		this.socket.emit('bookmark:create', config);
	}

	updateBookmark(config) {
		this.socket.emit('bookmark:update', config);
	}

	deleteBookmark(config) {
		this.socket.emit('bookmark:delete', config);
	}
}

export default new Bookmark();
