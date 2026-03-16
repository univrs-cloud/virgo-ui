import Configuration from 'stores/configuration';

let callbackCollection = [];
let storeSubscription = null;

const getConfiguration = () => {
	return Configuration.getConfiguration();
};

const updateSmtp = (config) => {
	Configuration.updateSmtp(config);
};

const updateLocation = (config) => {
	Configuration.updateLocation(config);
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	if (!storeSubscription) {
		storeSubscription = Configuration.subscribeToProperties(['configuration'], handleSubscription);
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
	getConfiguration,
	updateSmtp,
	updateLocation
};
