import Docker from 'stores/docker';

let callbackCollection = [];

const getSocket = () => {
	return Docker.socket;
};

const composeUrlFromProxy = (proxy) => {
	return `${proxy.sslForced ? 'https://' : 'http://'}${_.first(proxy.domainNames)}`;
};

const composeApps = (configured, containers, proxies) => {
	if (_.isNull(configured) || _.isNull(containers)) {
		return null;
	}
	
	return _.map(
		_.orderBy(
			_.filter(configured.configuration, { type: 'app' }),
			 ['title'],
			 ['asc']
		),
		(entity) => {
			entity.id = entity.name;
			let container = _.find(containers, (container) => { return _.includes(container.names, `/${entity.name}`) });
			if (container) {
				entity.id = container.id;
				entity.state = container.state;
				entity.composeProject = container.labels.comDockerComposeProject ?? false;
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
				let proxy = _.find(proxies, { forwardHost: entity.name });
				entity.ports = _.orderBy(_.filter(container.ports, { ip: '0.0.0.0' }), ['privatePort'], ['asc']);
				if (!_.isEmpty(proxy)) {
					entity.url = composeUrlFromProxy(proxy);
				} else if (!_.isEmpty(entity.ports)) {
					_.each(entity.ports, (port) => {
						let proxy = _.find(proxies, { forwardPort: port.publicPort });
						if (!_.isEmpty(proxy)) {
							entity.url = composeUrlFromProxy(proxy);
						}
					});
				}
			}
			return entity;
		});
}

const getApps = () => {
	return composeApps(Docker.getConfigured(), Docker.getContainers(), Docker.getProxies());
};

const performAction = (config) => {
	Docker.performAction(config);
};

const handleSubscription = (properties) => {
	let apps = composeApps(properties.configured, properties.containers, properties.proxies);

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
	getSocket,
	getApps,
	performAction
};
