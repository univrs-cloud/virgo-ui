import Store from 'stores/store';

class Bookmark extends Store {
	constructor() {
		const initialState = {};
		super({
			namespace: 'bookmark'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			if (this.getStateProperty('configuringNetworkInterface')) {
				return;
			}
			
			if (this.getStateProperty('reboot') || this.getStateProperty('shutdown') || !_.isNull(this.getStateProperty('update'))) {
				return;
			}
			
			_.each(_.keys(initialState), (key) => { initialState[key] = false; });
			this.setState(initialState, 'socket_disconnect');
			_.each(_.keys(initialState), (key) => { initialState[key] = null; });
		});
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
