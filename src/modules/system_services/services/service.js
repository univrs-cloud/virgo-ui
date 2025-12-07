import Host from 'stores/host';

let callbackCollection = [];

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

	return Host.subscribeToProperties(['services'], handleSubscription);
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
	getServices
};
