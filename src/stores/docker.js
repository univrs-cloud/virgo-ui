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
		this.resourceMetricsWatchers = 0;
		this.isWatchingResourceMetrics = false;
		this.resourceMetricsTimer = null;

		this.socket.on('connect', () => {
			if (this.resourceMetricsWatchers > 0) {
				this.socket.emit('app:resourceMetrics:watch', true);
			}
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

	watchResourceMetrics(isWatching) {
		this.resourceMetricsWatchers = Math.max(this.resourceMetricsWatchers + (isWatching ? 1 : -1), 0);
		clearTimeout(this.resourceMetricsTimer);
		this.resourceMetricsTimer = setTimeout(() => {
			const isNowWatching = (this.resourceMetricsWatchers > 0);
			if (isNowWatching === this.isWatchingResourceMetrics) {
				return;
			}

			this.isWatchingResourceMetrics = isNowWatching;
			this.socket.emit('app:resourceMetrics:watch', isNowWatching);
		});
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

	updateSnapshots(data) {
		this.socket.emit('app:snapshots:update', data);
	}

	setOrder(data) {
		this.socket.emit('app:order', data);
	}

	groupUnmanagedContainers(configured, containers) {
		const appNames = _.map(_.filter(configured, { type: 'app' }), (entity) => { return _.toLower(entity.name); });
		const unmanagedContainers = _.reject(containers, (container) => {
			return _.includes(appNames, _.toLower(container.labels?.comDockerComposeProject));
		});
		return _.orderBy(
			_.map(
				_.groupBy(unmanagedContainers, (container) => { return container.labels?.comDockerComposeProject || container.id; }),
				(groupContainers) => {
					const project = groupContainers[0].labels?.comDockerComposeProject || null;
					return {
						name: project || groupContainers[0].id,
						title: project || _.trimStart(_.first(groupContainers[0].names), '/'),
						isStack: Boolean(project),
						containers: _.orderBy(groupContainers, ['labels.comDockerComposeService'], ['asc'])
					};
				}
			),
			[(group) => { return _.toLower(group.title); }],
			['asc']
		);
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
