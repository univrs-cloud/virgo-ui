import Store from 'stores/store';

class Share extends Store {
	constructor() {
		const initialState = {
			shares: null,
			clients: null
		};
		super({
			namespace: 'share'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('shares', (shares) => {
			this.setState({ shares }, 'get_shares');
		});

		this.socket.on('share:clients', (clients) => {
			this.setState({ clients }, 'get_clients');
		});
	}

	getShares() {
		return this.getStateProperty('shares');
	}

	getClients() {
		return this.getStateProperty('clients');
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

	updateSnapshots(data) {
		this.socket.emit('share:snapshots:update', data);
	}
}

export default new Share();
