import Host from 'stores/host';

let callbackCollection = [];

const getSystem = () => {
	return Host.getSystem();
};

const updateHostIdentifier = (config) => {
	Host.updateHostIdentifier(config);
};

const updateInterface = (config) => {
	Host.updateInterface(config);
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	return Host.subscribeToProperties(['system'], handleSubscription);
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe,
	getSystem,
	updateHostIdentifier,
	updateInterface
};
