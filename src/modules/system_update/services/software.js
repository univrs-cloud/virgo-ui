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

const update = () => {
	return Host.update();
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	return Host.subscribeToProperties(['checkUpdates', 'updates'], handleSubscription);
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe,
	getCheckUpdates,
	getUpdates,
	checkUpdates,
	update
};
