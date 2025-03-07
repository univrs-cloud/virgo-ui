import Configuration from 'stores/configuration';

let callbackCollection = [];

const getConfiguration = () => {
	return Configuration.getConfiguration();
};

const setSmtp = (config) => {
	Configuration.setSmtp(config);
};

const setLocation = (config) => {
	Configuration.setLocation(config);
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
	setSmtp,
	setLocation
};
