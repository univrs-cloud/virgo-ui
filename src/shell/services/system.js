import Host from 'stores/host';

let callbackCollection = [];
let storeSubscription = null;

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
	if (!storeSubscription) {
		storeSubscription = Host.subscribeToProperties(['system'], handleSubscription);
	}

	return () => {
		callbackCollection = _.filter(callbackCollection, (callback) => !_.includes(callbacks, callback));
		if (_.isEmpty(callbackCollection) && storeSubscription) {
			storeSubscription();
			storeSubscription = null;
		}
	};
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
