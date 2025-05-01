import Host from 'stores/host';

let callbackCollection = [];

const getCheckUpdates = () => {
	return Host.getCheckUpdates();
};

const getUpdates = () => {
	return Host.getUpdates();
};

const checkUpdates = () => {
	return Host.checkUpdates();
};

const upgrade = () => {
	return Host.upgrade();
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Host.subscribeToProperties(['checkUpdates', 'updates'], handleSubscription);
};

export {
	subscribe,
	getCheckUpdates,
	getUpdates,
	checkUpdates,
	upgrade
};
