import Store from 'stores/store';

class Share extends Store {
	constructor() {
		const initialState = {
			shares: null
		};
		super({
			namespace: 'share'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			this.setState(initialState, 'socket_disconnect');
		});

		this.socket.on('shares', (shares) => {
			this.setState({ shares }, 'get_shares');
		});
	}

	getShares() {
		return this.getStateProperty('shares');
	}

	createShare(data) {
		this.socket.emit('share:create', data);
	}

	updateShare(data) {
		this.socket.emit('share:update', data);
	}

	deleteShare(data) {
		this.socket.emit('share:delete', data);
	}
}

export default new Share();
