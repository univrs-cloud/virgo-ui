import Docker from 'stores/docker';
import Job from 'stores/job';

let callbackCollection = [];

const getSocket = () => {
	return Docker.socket;
};

const getJobs = () => {
	return Job.getJobs();
};

const getApps = () => {
	return composeApps(Docker.getConfigured(), Docker.getContainers(), Docker.getAppsResourceMetrics(), Docker.getImageUpdates());
};

const composeApps = (configured, containers, appsResourceMetrics, imageUpdates) => {
	if (_.isNull(configured) || _.isNull(containers)) {
		return null;
	}
	
	return _.map(
		_.orderBy(
			_.filter(configured, { type: 'app' }),
			[(entity) => { return entity.title.toLowerCase(); }],
			['asc']
		),
		(entity) => {
			let container = _.find(containers, (container) => {
				if (!container.name) {
					return false;
				}

				// Match by exact container name (backward compatibility) or pattern {project_name}-{service_name}-{number}
				const patternRegex = new RegExp(`^/${entity.name}-${entity.name}-\\d+$`);
				return container.name === entity.name || _.some(container.names, (name) => { return patternRegex.test(name); });
			});
			if (container) {
				entity.composeProject = container?.labels?.comDockerComposeProject || false;
				if (entity.composeProject) {
					entity.projectContainers = _.orderBy(
						_.filter(containers, (container) => {
							return container.labels && container.labels['comDockerComposeProject'] === entity.composeProject;
						}),
						 ['labels.comDockerComposeService'],
						 ['asc']
					);
				} else {
					entity.projectContainers = [container];
				}
				entity.hasUpdates = _.some(imageUpdates, ({ imageName, containerId }) => {
					return _.some(entity.projectContainers, (container) => {
						return container.id === containerId;
					});
				});
				entity.projectContainers = _.map(entity.projectContainers, (container) => {
					container.hasUpdates = !_.isEmpty(_.filter(imageUpdates, { containerId: container.id }));
					return container;
				});
				let activeCount = _.size(_.filter(entity.projectContainers, (container) => { return _.includes(['running', 'restarting'], container.state); }));
				if (activeCount === _.size(entity.projectContainers)) {
					entity.state = 'success'; // All containers are running or restarting
				} else if (activeCount === 0) {
					entity.state = 'danger'; // No containers are running or restarting
				} else {
					entity.state = 'warning'; // Some containers are running/restarting, others are not
				}
				entity.ports = _.orderBy(_.filter(container.ports, { ip: '0.0.0.0' }), ['privatePort'], ['asc']);
				entity.url = Docker.composeUrlFromLabels(container.labels);
			}
			entity.resourceMetrics = _.find(appsResourceMetrics, { name: entity.name });
			return entity;
		});
}

const update = (config) => {
	Docker.update(config);
};

const performAppAction = (config) => {
	Docker.performAppAction(config);
};

const performServiceAction = (config) => {
	Docker.performServiceAction(config);
};

const handleSubscription = (properties) => {
	const apps = composeApps(properties.configured, properties.containers, properties.appsResourceMetrics, properties.imageUpdates);
	_.each(callbackCollection, (callback) => {
		callback({ apps, jobs: properties.jobs });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	return Docker.subscribeToProperties(['configured', 'containers', 'appsResourceMetrics', 'imageUpdates', 'jobs'], handleSubscription);
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe,
	getSocket,
	getJobs,
	getApps,
	update,
	performAppAction,
	performServiceAction
};
