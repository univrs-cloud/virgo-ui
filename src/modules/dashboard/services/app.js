import Docker from 'stores/docker';

let callbackCollection = [];

const performAction = (config) => {
	Docker.performAction(config);
};

const handleSubscription = (properties) => {
	if (_.isNull(properties.configured) || _.isNull(properties.containers)) {
		return;
	}

	let apps = _.map(properties.configured.configuration, (entity) => {
		entity.id = entity.name;
		if (entity.type === 'app') {
			let container = _.find(properties.containers, (container) => { return _.includes(container.names, `/${entity.name}`) });
			if (container) {
				entity.id = container.id;
				entity.composeProject = container.labels.comDockerComposeProject ?? false;
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
				entity.hasUpdates = _.some(imageUpdates, ({ imageName, containerId }) => {
					return _.some(entity.projectContainers, (container) => {
						return container.id === containerId;
					});
				});
				let activeCount = _.size(_.filter(entity.projectContainers, (container) => { return _.includes(['running', 'restarting'], container.state); }));
				if (activeCount === _.size(entity.projectContainers)) {
					entity.state = 'success';  // All containers are running or restarting
				} else if (activeCount === 0) {
					entity.state = 'danger';   // No containers are running or restarting
				} else {
					entity.state = 'warning';  // Some containers are running/restarting, others are not
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
	
	Docker.subscribeToProperties(['configured', 'containers', 'imageUpdates'], handleSubscription);
};

export {
	subscribe,
	performAction
};
