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

		this.socket.on('shares', (shares) => {
			this.setState({ shares }, 'get_shares');
		});
	}

	getShares() {
		return this.getStateProperty('shares');
	}

	createShare(config) {
		this.socket.emit('share:create', config);
	}

	updateShare(config) {
		this.socket.emit('share:update', config);
	}

	deleteShare(config) {
		this.socket.emit('share:delete', config);
	}
}

export default new Share();
