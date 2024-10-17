import Host from 'stores/host';

let callbackCollection = [];

const reboot = () => {
	return Host.reboot();
};

const shutdown = () => {
	return Host.shutdown();
};

const handleSubscription = (updatedProperties) => {
	_.each(callbackCollection, (callback) => {
		callback(updatedProperties);
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
