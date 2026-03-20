import Host from 'stores/host';

let callbackCollection = [];
let storeSubscription = null;

const getSocket = () => {
	return Host.socket;
};

const syncServices = () => {
	Host.syncServices();
};

const getServices = () => {
	return Host.getServices();
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	if (!storeSubscription) {
		storeSubscription = Host.subscribeToProperties(['services'], handleSubscription);
	}

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
	unsubscribe,
	syncServices,
	getServices,
	getSocket
};
