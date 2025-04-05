import Docker from 'stores/docker';

let callbackCollection = [];

const composeUrlFromProxy = (proxy) => {
	return `${proxy.sslForced ? 'https://' : 'http://'}${_.first(proxy.domainNames)}`;
};

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
				let activeCount = _.size(_.filter(entity.projectContainers, (container) => { return _.includes(['running', 'restarting'], container.state); }));
				if (activeCount === _.size(entity.projectContainers)) {
					entity.state = 'success';  // All containers are running or restarting
				} else if (activeCount === 0) {
					entity.state = 'danger';   // No containers are running or restarting
				} else {
					entity.state = 'warning';  // Some containers are running/restarting, others are not
				}
				
				let proxy = _.find(properties.proxies, { forwardHost: entity.name });
				if (!_.isEmpty(proxy)) {
					entity.url = composeUrlFromProxy(proxy);
				} else {
					let ports = _.filter(container.ports, { ip: '0.0.0.0' });
					if (!_.isEmpty(ports)) {
						_.each(ports, (port) => {
							let proxy = _.find(properties.proxies, { forwardPort: port.publicPort });
							if (!_.isEmpty(proxy)) {
								entity.url = composeUrlFromProxy(proxy);
							}
						});
					}
				}
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
	
	Docker.subscribeToProperties(['configured', 'containers', 'proxies'], handleSubscription);
};

export {
	subscribe,
	performAction
};
