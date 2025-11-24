import Host from 'stores/host';

let callbackCollection = [];

const getSystem = () => {
	return Host.getSystem();
};

const getFQDN = () => {
	const system = getSystem();
	return system.osInfo.fqdn;
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

const unsubscribe = (subscription) => {
	if (subscription) {
		subscription();
	}
};

export {
	subscribe,
	unsubscribe,
	getSystem,
	getFQDN
};
