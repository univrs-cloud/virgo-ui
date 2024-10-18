import Host from 'stores/host';
import Docker from 'stores/docker';

let callbackCollection = [];

const getProxies = () => {
	return Docker.getProxies();
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Host.subscribeToProperties(['proxies'], handleSubscription);
};

export {
	subscribe,
	getProxies
};
