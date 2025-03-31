import Host from 'stores/host';

let callbackCollection = [];

const getProxies = () => {
	return Host.getProxies();
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
