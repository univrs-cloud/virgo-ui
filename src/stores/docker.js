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

		this.socket.on('app:configured', (configured) => {
			this.setState({ configured }, 'set_configured');
		});

		this.socket.on('app:containers', (containers) => {
			this.setState({ containers }, 'set_containers');
		});

		this.socket.on('app:updates', (imageUpdates) => {
			this.setState({ imageUpdates }, 'set_container_updates');
		});

		this.socket.on('app:templates', (templates) => {
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
		this.socket.emit('app:install', config);
	}

	update(config) {
		this.socket.emit('app:update', config);
	}

	performAppAction(config) {
		this.socket.emit('app:performAction', config);
	}

	performServiceAction(config) {
		this.socket.emit('app:service:performAction', config);
	}

	setOrder(config) {
		this.socket.emit('app:order', config);
	}

	composeUrlFromLabels(labels) {
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
}

export default new Docker();
