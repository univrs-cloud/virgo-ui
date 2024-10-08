import Host from '../stores/host';

let callbackCollection = [];

const reboot = () => {
	return Host.reboot();
};

const shutdown = () => {
	return Host.shutdown();
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

	Host.subscribeToProperties(['reboot', 'shutdown'], handleSubscription);
};

export {
	subscribe,
	reboot,
	shutdown
};
