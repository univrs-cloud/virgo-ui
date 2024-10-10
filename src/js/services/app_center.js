import Docker from 'js/stores/docker';

let callbackCollection = [];

const install = (config) => {
	Docker.install(config);
};

const handleSubscription = (updatedProperties) => {
	_.each(callbackCollection, (callback) => {
		callback(updatedProperties);
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
