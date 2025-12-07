import Host from 'stores/host';

let callbackCollection = {
	updates: [],
	update: []
};

const checkUpdates = () => {
	return Host.checkUpdates();
};

const update = () => {
	return Host.update();
};

const completeUpdate = () => {
	return Host.completeUpdate();
};

const getCheckUpdates = () => {
	return Host.getCheckUpdates();
};

const getUpdates = () => {
	return Host.getUpdates();
};

const getUpdate = () => {
	return Host.getUpdate();
};

const handleUpdatesSubscription = (properties) => {
	_.each(callbackCollection.updates, (callback) => {
		callback(properties);
	});
};

const handleUpdateSubscription = (properties) => {
	_.each(callbackCollection.update, (callback) => {
		callback(properties);
	});
};

const subscribeToUpdates = (callbacks) => {
	callbackCollection.updates = _.concat(callbackCollection.updates, callbacks);
	return Host.subscribeToProperties(['checkUpdates', 'updates'], handleUpdatesSubscription);
};

const subscribeToUpdate = (callbacks) => {
	callbackCollection.update = _.concat(callbackCollection.update, callbacks);
	return Host.subscribeToProperties(['update'], handleUpdateSubscription);
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribeToUpdates,
	subscribeToUpdate,
	unsubscribe,
	checkUpdates,
	update,
	completeUpdate,
	getCheckUpdates,
	getUpdates,
	getUpdate
};
