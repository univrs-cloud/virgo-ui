import Store from 'stores/store';

class Docker extends Store {
	constructor() {
		const initialState = {
			configured: null,
			containers: null,
			imageUpdates: null,
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

		this.socket.on('containers', (containers) => {
			this.setState({ containers }, 'set_containers');
		});

		this.socket.on('updates', (imageUpdates) => {
			this.setState({ imageUpdates }, 'set_container_updates');
		});

		this.socket.on('templates', (templates) => {
			this.setState({ templates }, 'set_templates');
		});
	}

	getConfigured() {
		return this.getStateProperty('configured');
	}

	getContainers() {
		return this.getStateProperty('containers');
	}

	getImageUpdates() {
		return this.getStateProperty('imageUpdates');
	}

	getTemplates() {
		return this.getStateProperty('templates');
	}

	install(config) {
		this.socket.emit('install', config);
	}

	update(config) {
		this.socket.emit('update', config);
	}

	performAppAction(config) {
		this.socket.emit('performAppAction', config);
	}

	performServiceAction(config) {
		this.socket.emit('performServiceAction', config);
	}

	composeUrlFromLabels (labels) {
		const hostKey = _.findKey(labels, (value) => {
			return _.isString(value) && _.startsWith(value, 'Host');
		});
		if (!hostKey) {
			return '';
		}
	
		const hasTls = _.some(labels, (value, key) => {
			return key === _.replace(hostKey, 'Rule', 'Entrypoints') && value === 'https';
		});
		const hostValue = labels[hostKey];
		const host = _.get(hostValue.match(/Host\(`([^`]+)`\)/), 1);
		const protocol = _.cond([
			[() => hasTls, _.constant('https')],
			[_.stubTrue, _.constant('http')]
		])();
		
		return `${protocol}://${host}`;
	}

	createBookmark (config) {
		this.socket.emit('createBookmark', config);
	}

	updateBookmark (config) {
		this.socket.emit('updateBookmark', config);
	}

	deleteBookmark (config) {
		this.socket.emit('deleteBookmark', config);
	}
}

export default new Docker();
