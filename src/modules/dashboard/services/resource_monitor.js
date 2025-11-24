import Host from 'stores/host';

let callbackCollection = [];

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	return Host.subscribeToProperties(['system', 'cpuStats', 'memory', 'networkStats', 'storage', 'drives', 'ups', 'time'], handleSubscription);
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe
};
