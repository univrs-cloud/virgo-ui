import Store from 'js/stores/store';

class Configuration extends Store {
	constructor() {
		const initialState = {
			configuration: null
		};
		super({
			namespace: 'configuration'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('configuration', (configuration) => {
			this.setState({ configuration }, 'get_configuration');
		});
	}

	setLocation(config) {
		this.socket.emit('location', config);
	}

	getConfiguration() {
		return this.getStateProperty('configuration');
	};
}

export default new Configuration();
