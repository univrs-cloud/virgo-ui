import Store from 'stores/store';

class Docker extends Store {
	constructor() {
		const initialState = {
			configured: null,
			containers: null,
			imageUpdates: null,
			appsResourceMetrics: null,
			templates: null
		};
		super({
			namespace: 'docker'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			this.setState(initialState, 'socket_disconnect');
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

	install(data) {
		this.socket.emit('app:install', data);
	}

	update(data) {
		this.socket.emit('app:update', data);
	}

	performAppAction(data) {
		this.socket.emit('app:performAction', data);
	}

	performServiceAction(data) {
		this.socket.emit('app:service:performAction', data);
	}

	setOrder(data) {
		this.socket.emit('app:order', data);
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
