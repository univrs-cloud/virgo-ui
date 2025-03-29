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
		_.orderBy(_.filter(configured.configuration, { type: 'app' }), ['title'], ['asc']),
		(entity) => {
			let dockerContainer = _.find(containers, { name: entity.name });
			entity.id = entity.name;
			entity.state = '';
			if (dockerContainer) {
				entity.id = dockerContainer.id;
				entity.state = dockerContainer.state;
				let proxy = _.find(proxies, { forwardHost: dockerContainer.name });
				entity.ports = _.orderBy(_.filter(dockerContainer.ports, { IP: '0.0.0.0' }), ['PrivatePort'], ['asc']);
				if (!_.isEmpty(proxy)) {
					entity.url = composeUrlFromProxy(proxy);
				} else if (!_.isEmpty(entity.ports)) {
					_.each(entity.ports, (port) => {
						let proxy = _.find(proxies, { forwardPort: port.PublicPort });
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
