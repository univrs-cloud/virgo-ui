import Host from 'stores/host';

let callbackCollection = [];

const getSystem = () => {
	return Host.getSystem();
};

const updateDefaultGateway = (config) => {
	Host.updateDefaultGateway(config);
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

	Host.subscribeToProperties(['system'], handleSubscription);
};

export {
	subscribe,
	getSystem,
	updateDefaultGateway,
	updateHostIdentifier,
	updateInterface
};
