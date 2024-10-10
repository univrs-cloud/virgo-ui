import Store from 'js/stores/store';

class Docker extends Store {
	constructor() {
		const initialState = {
			configured: null,
			templates: null
		};
		super({
			namespace: 'docker'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			if (this.getStateProperty('reboot') || this.getStateProperty('shutdown') || !_.isNull(this.getStateProperty('upgrade'))) {
				return;
			}
			
			_.each(_.keys(initialState), (key) => { initialState[key] = false; });
			this.setState(initialState, 'socket_disconnect');
			_.each(_.keys(initialState), (key) => { initialState[key] = null; });
		});

		this.socket.on('configured', (configured) => {
			this.setState({ configured }, 'set_configured');
		});

		this.socket.on('templates', (templates) => {
			this.setState({ templates }, 'set_templates');
		});
	}

	install(config) {
		this.socket.emit('install', config);
	}

	performAction(config) {
		this.socket.emit('performAction', config);
	}
}

export default new Docker();
