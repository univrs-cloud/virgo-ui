import Metrics from 'stores/metrics';

let callbackCollection = [];

const fetch = () => {
	Metrics.fetch();
};

const enable = () => {
	Metrics.enable();
};

const disable = () => {
	Metrics.disable();
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		const metrics = properties.metrics;
		callback({ metrics });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	Metrics.fetch();
	return Metrics.subscribeToProperties(['metrics'], handleSubscription);
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe,
	fetch,
	enable,
	disable
};
