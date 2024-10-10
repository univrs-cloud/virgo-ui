import Host from '../stores/host';

let callbackCollection = [];

const getProxies = () => {
	return Host.getProxies();
};

const handleSubscription = (updatedProperties) => {
	_.each(callbackCollection, (callback) => {
		callback(updatedProperties);
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
