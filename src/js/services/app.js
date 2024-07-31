import Host from '../stores/host';
import Docker from '../stores/docker';

let callbackCollection = [];

const composeUrlFromProxy = (proxy) => {
	return `${proxy.sslForced ? 'https://' : 'http://'}${_.first(proxy.domainNames)}`;
};

const performAction = (config) => {
	Docker.performAction(config);
};

const handleSubscription = (store) => {
	if (!store) {
		return;
	}

	let state = store.state;
	if (_.isNull(state.proxies) || _.isNull(state.configured)) {
		return;
	}

	let apps = _.map(state.configured.configuration, (entity) => {
		let dockerContainer = _.find(state.configured.containers, { name: entity.name });
		entity.state = '';
		if (dockerContainer) {
			entity.state = dockerContainer.state;
			let proxy = _.find(state.proxies, { forwardHost: dockerContainer.name });
			if (!_.isEmpty(proxy)) {
				entity.url = composeUrlFromProxy(proxy);
			} else if (!_.isEmpty(dockerContainer.ports)) {
				let ports = _.filter(dockerContainer.ports, { IP: '0.0.0.0' });
				if (!_.isEmpty(ports)) {
					_.each(ports, (port) => {
						let proxy = _.find(state.proxies, { forwardPort: port.PublicPort });
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
};

Host.subscribeToProperties(['proxies'], handleSubscription);
Docker.subscribeToProperties(['configured'], handleSubscription);

export {
	subscribe,
	performAction
};
