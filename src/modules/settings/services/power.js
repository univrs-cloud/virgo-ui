import Host from 'stores/host';

let callbackCollection = [];

const reboot = () => {
	return Host.reboot();
};

const shutDown = () => {
	return Host.shutDown();
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Host.subscribeToProperties(['reboot', 'shutdown'], handleSubscription);
};

export {
	subscribe,
	reboot,
	shutDown
};
