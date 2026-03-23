import Host from 'stores/host';

let callbackCollection = [];
let storeSubscription = null;

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	if (!storeSubscription) {
		storeSubscription = Host.subscribeToProperties(['system', 'cpuStats', 'memory', 'networkStats', 'storage', 'drives', 'ups', 'time'], handleSubscription);
	}
	callbackCollection = _.concat(callbackCollection, callbacks);
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			handleSubscription(_.pick(Host.getState() || {}, ['system', 'cpuStats', 'memory', 'networkStats', 'storage', 'drives', 'ups', 'time']));
		});
	});

	return () => {
		callbackCollection = _.filter(callbackCollection, (callback) => !_.includes(callbacks, callback));
		if (_.isEmpty(callbackCollection) && storeSubscription) {
			storeSubscription();
			storeSubscription = null;
		}
	};
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
