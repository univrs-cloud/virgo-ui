import Docker from 'stores/docker';

let callbackCollection = [];

const composeUrlFromProxy = (proxy) => {
	return `${proxy.sslForced ? 'https://' : 'http://'}${_.first(proxy.domainNames)}`;
};

const performAction = (config) => {
	Docker.performAction(config);
};

const handleSubscription = (updatedProperties) => {
	if (_.isNull(updatedProperties.configured)) {
		return;
	}

	let apps = _.map(updatedProperties.configured.configuration, (entity) => {
		let dockerContainer = _.find(updatedProperties.configured.containers, { name: entity.name });
		entity.id = entity.name;
		entity.state = '';
		if (dockerContainer) {
			entity.id = dockerContainer.id;
			entity.state = dockerContainer.state;
			let proxy = _.find(updatedProperties.proxies, { forwardHost: dockerContainer.name });
			if (!_.isEmpty(proxy)) {
				entity.url = composeUrlFromProxy(proxy);
			} else if (!_.isEmpty(dockerContainer.ports)) {
				let ports = _.filter(dockerContainer.ports, { IP: '0.0.0.0' });
				if (!_.isEmpty(ports)) {
					_.each(ports, (port) => {
						let proxy = _.find(updatedProperties.proxies, { forwardPort: port.PublicPort });
						if (!_.isEmpty(proxy)) {
							entity.url = composeUrlFromProxy(proxy);
						}
					});
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
	
	Docker.subscribeToProperties(['proxies', 'configured'], handleSubscription);
};

export {
	subscribe,
	performAction
};
