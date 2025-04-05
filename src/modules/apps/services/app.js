import Host from 'stores/host';
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
				let activeCount = _.size(_.filter(entity.projectContainers, (container) => { return _.includes(['running', 'restarting'], container.state); }));
				if (activeCount === _.size(entity.projectContainers)) {
					entity.state = 'success';  // All containers are running or restarting
				} else if (activeCount === 0) {
					entity.state = 'danger';   // No containers are running or restarting
				} else {
					entity.state = 'warning';  // Some containers are running/restarting, others are not
				}

				let proxy = _.find(proxies, { forwardHost: entity.name });
				if (!_.isEmpty(proxy)) {
					entity.url = composeUrlFromProxy(proxy);
				} else {
					let ports = _.filter(container.ports, { ip: '0.0.0.0' });
					if (!_.isEmpty(ports)) {
						_.each(ports, (port) => {
							let proxy = _.find(proxies, { forwardPort: port.publicPort });
							if (!_.isEmpty(proxy)) {
								entity.url = composeUrlFromProxy(proxy);
							}
						});
					}
				}

				entity.ports = _.orderBy(_.filter(container.ports, { ip: '0.0.0.0' }), ['privatePort'], ['asc']);
			}
			return entity;
		});
}

const getApps = () => {
	return composeApps(Docker.getConfigured(), Docker.getContainers(), Host.getProxies());
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
