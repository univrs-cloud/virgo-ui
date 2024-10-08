import Docker from '../stores/docker';

let callbackCollection = [];

const install = (config) => {
	Docker.install(config);
};

const handleSubscription = (store) => {
	if (!store) {
		return;
	}

	let state = store.state;
	_.each(callbackCollection, (callback) => {
		callback(state);
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
