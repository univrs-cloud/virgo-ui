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

	createBookmark(data) {
		this.socket.emit('bookmark:create', data);
	}

	updateBookmark(data) {
		this.socket.emit('bookmark:update', data);
	}

	deleteBookmark(data) {
		this.socket.emit('bookmark:delete', data);
	}
}

export default new Bookmark();
