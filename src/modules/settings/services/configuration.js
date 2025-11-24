import Configuration from 'stores/configuration';

let callbackCollection = [];

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

	return Configuration.subscribeToProperties(['configuration'], handleSubscription);
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
