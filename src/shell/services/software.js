import Host from 'stores/host';

let callbackCollection = {
	updates: [],
	upgrade: []
};

const checkUpdates = () => {
	return Host.checkUpdates();
};

const upgrade = () => {
	return Host.upgrade();
};

const completeUpgrade = () => {
	return Host.completeUpgrade();
};

const getCheckUpdates = () => {
	return Host.getCheckUpdates();
};

const getUpdates = () => {
	return Host.getUpdates();
};

const getUpgrade = () => {
	return Host.getUpgrade();
};

const handleUpdatesSubscription = (updatedProperties) => {
	_.each(callbackCollection.updates, (callback) => {
		callback(updatedProperties);
	});
};

const handleUpgradeSubscription = (updatedProperties) => {
	_.each(callbackCollection.upgrade, (callback) => {
		callback(updatedProperties);
	});
};

const subscribeToUpdates = (callbacks) => {
	callbackCollection.updates = _.concat(callbackCollection.updates, callbacks);

	Host.subscribeToProperties(['checkUpdates', 'updates'], handleUpdatesSubscription);
};

const subscribeToUpgrade = (callbacks) => {
	callbackCollection.upgrade = _.concat(callbackCollection.upgrade, callbacks);

	Host.subscribeToProperties(['upgrade'], handleUpgradeSubscription);
};

export {
	subscribeToUpdates,
	subscribeToUpgrade,
	checkUpdates,
	upgrade,
	completeUpgrade,
	getCheckUpdates,
	getUpdates,
	getUpgrade
};
