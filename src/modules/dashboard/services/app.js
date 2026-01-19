import Docker from 'stores/docker';

let callbackCollection = [];

const performAction = (config) => {
	Docker.performAction(config);
};

const setOrder = (config) => {
	Docker.setOrder(config);
};

const handleSubscription = (properties) => {
	if (_.isNull(properties.configured) || _.isNull(properties.containers)) {
		return;
	}
	
	let apps = _.map(properties.configured, (entity) => {
		if (entity.type === 'app') {
			const container = properties.containers[0];
			if (container) {
				entity.composeProject = container.labels.comDockerComposeProject || false;
				if (entity.composeProject) {
					entity.projectContainers = _.orderBy(
						_.filter(properties.containers, (container) => {
							return container.labels && container.labels['comDockerComposeProject'] === entity.composeProject;
						}),
						 ['labels.comDockerComposeService'],
						 ['asc']
					);
				} else {
					entity.projectContainers = [container];
				}
				entity.hasUpdates = _.some(properties.imageUpdates, ({ imageName, containerId }) => {
					return _.some(entity.projectContainers, (container) => {
						return container.id === containerId;
					});
				});
				let activeCount = _.size(_.filter(entity.projectContainers, (container) => { return _.includes(['running', 'restarting'], container.state); }));
				if (activeCount === _.size(entity.projectContainers)) {
					entity.state = 'success'; // All containers are running or restarting
				} else if (activeCount === 0) {
					entity.state = 'danger'; // No containers are running or restarting
				} else {
					entity.state = 'warning'; // Some containers are running/restarting, others are not
				}
				
				entity.url = Docker.composeUrlFromLabels(container.labels);
			}
		}
		return entity;
	});
	apps = _.groupBy(apps, 'category');
	apps = _.pick(apps, _.keys(apps));

	_.each(callbackCollection, (callback) => {
		callback({ apps });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	return Docker.subscribeToProperties(['configured', 'containers', 'imageUpdates'], handleSubscription);
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe,
	performAction,
	setOrder
};
