import Metrics from 'stores/metrics';

let callbackCollection = [];
let storeSubscription = null;

const fetch = () => {
	Metrics.fetch();
};

const getMetrics = () => {
	return Metrics.getMetrics();
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
	if (!storeSubscription) {
		storeSubscription = Metrics.subscribeToProperties(['metrics'], handleSubscription);
	}
	callbackCollection = _.concat(callbackCollection, callbacks);
	Metrics.fetch();
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			handleSubscription(_.pick(Metrics.getState() || {}, ['metrics']));
		});
	});

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
	fetch,
	getMetrics,
	enable,
	disable
};
