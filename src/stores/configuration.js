import Store from 'stores/store';

class Configuration extends Store {
	constructor() {
		const initialState = {
			configuration: null
		};
		super({
			namespace: 'configuration'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			this.setState(initialState, 'socket_disconnect');
		});

		this.socket.on('configuration', (configuration) => {
			this.setState({ configuration }, 'get_configuration');
		});
	}

	updateSmtp(data) {
		this.socket.emit('configuration:smtp:update', data);
	}

	updateLocation(data) {
		this.socket.emit('configuration:location:update', data);
	}

	updateFleet(data) {
		this.socket.emit('configuration:fleet:update', data);
	}

	enableFleet() {
		this.socket.emit('configuration:fleet:enable');
	}

	disableFleet() {
		this.socket.emit('configuration:fleet:disable');
	}

	addTrustedProxy(data) {
		this.socket.emit('configuration:trustedProxy:add', data);
	}

	updateTrustedProxy(data) {
		this.socket.emit('configuration:trustedProxy:update', data);
	}

	deleteTrustedProxy(data) {
		this.socket.emit('configuration:trustedProxy:delete', data);
	}

	getConfiguration() {
		return this.getStateProperty('configuration');
	};
}

export default new Configuration();
