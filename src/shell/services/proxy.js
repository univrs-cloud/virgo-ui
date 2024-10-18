import Host from 'stores/host';
import Docker from 'stores/docker';

let callbackCollection = [];

const getProxies = () => {
	return Docker.getProxies();
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
