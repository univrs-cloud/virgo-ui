import Host from '../stores/host';

let callbackCollection = [];

const getProxies = () => {
	return Host.getProxies();
};

const handleSubscription = (store) => {
	if (!store) {
		return;
	}

	let state = store.state;
	_.each(callbackCollection, (callback) => {
		callback(state);
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
