import Weather from 'stores/weather';

let callbackCollection = [];

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Weather.subscribeToProperties(['weather'], handleSubscription);
};

export {
	subscribe
};
