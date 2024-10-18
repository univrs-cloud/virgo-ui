import Docker from 'stores/docker';

let callbackCollection = [];

const composeUrlFromProxy = (proxy) => {
	return `${proxy.sslForced ? 'https://' : 'http://'}${_.first(proxy.domainNames)}`;
};

const composeBookmark = (configured, proxies) => {
	if (_.isNull(configured)) {
		return;
	}
	
	return _.map(
		_.orderBy(_.filter(configured.configuration, { type: 'bookmark' }), ['title'], ['asc']),
		(entity) => {
			let dockerContainer = _.find(configured.containers, { name: entity.name });
			entity.id = entity.name;
			entity.state = '';
			if (dockerContainer) {
				entity.id = dockerContainer.id;
				entity.state = dockerContainer.state;
				let proxy = _.find(proxies, { forwardHost: dockerContainer.name });
				if (!_.isEmpty(proxy)) {
					entity.url = composeUrlFromProxy(proxy);
				} else if (!_.isEmpty(dockerContainer.ports)) {
					let ports = _.filter(dockerContainer.ports, { IP: '0.0.0.0' });
					if (!_.isEmpty(ports)) {
						_.each(ports, (port) => {
							let proxy = _.find(proxies, { forwardPort: port.PublicPort });
							if (!_.isEmpty(proxy)) {
								entity.url = composeUrlFromProxy(proxy);
							}
						});
					}
				}
			}
			return entity;
		});
}

const getBookmarks = () => {
	return composeBookmark(Docker.getConfigured(), Docker.getProxies());
};

const performAction = (config) => {
	Docker.performAction(config);
};

const handleSubscription = (updatedProperties) => {
	let bookmarks = composeBookmark(updatedProperties.configured, updatedProperties.proxies);

	_.each(callbackCollection, (callback) => {
		callback({ bookmarks });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	
	Docker.subscribeToProperties(['configured', 'proxies'], handleSubscription);
};

export {
	subscribe,
	getBookmarks,
	performAction
};
