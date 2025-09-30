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

	Configuration.subscribeToProperties(['configuration'], handleSubscription);
};

export {
	subscribe,
	getConfiguration,
	updateSmtp,
	updateLocation
};
