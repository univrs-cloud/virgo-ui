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

		this.socket.on('app:configured', (configured) => {
			this.setState({ configured }, 'set_configured');
		});

		this.socket.on('app:containers', (containers) => {
			this.setState({ containers }, 'set_containers');
		});

		this.socket.on('app:resourceMetrics', (appsResourceMetrics) => {
			this.setState({ appsResourceMetrics }, 'set_app_resource_metrics');
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

	getAppsResourceMetrics() {
		return this.getStateProperty('appsResourceMetrics');
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

	composeUrlFromLabels(projectContainers) {
		if (!projectContainers || projectContainers.length === 0) {
			return [];
		}

		const urls = [];
		// Iterate through all containers to find Traefik labels
		for (const container of projectContainers) {
			const labels = container.labels;
			
			if (!labels) {
				continue;
			}

			// Find all Traefik router rule labels (ends with "Rule" and contains Host(`...`))
			_.each(labels, (value, key) => {
				if (!_.isString(key) || !_.endsWith(key, 'Rule')) {
					return;
				}

				if (!_.isString(value) || !value.includes('Host(`')) {
					return;
				}

				// Extract the host from the rule value
				const host = _.get(value.match(/Host\(`([^`]+)`\)/), 1);
				if (_.isUndefined(host)) {
					return;
				}

				// Find the corresponding Entrypoints label to determine protocol
				const entrypointsKey = _.replace(key, 'Rule', 'Entrypoints');
				const hasTls = labels[entrypointsKey] === 'https';

				const protocol = _.cond([
					[() => hasTls, _.constant('https')],
					[_.stubTrue, _.constant('http')]
				])();
				urls.push(`${protocol}://${host}`);
			});
		}

		return urls;
	}
}

export default new Docker();
