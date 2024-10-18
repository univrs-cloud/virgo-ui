import Docker from 'stores/docker';

let callbackCollection = [];

const install = (config) => {
	Docker.install(config);
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Docker.subscribeToProperties(['templates'], handleSubscription);
};

export {
	subscribe,
	install
};
