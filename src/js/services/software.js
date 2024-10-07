import Host from '../stores/host';

let callbackCollection = [];

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
};

Host.subscribeToProperties(['checkUpdates', 'updates'], handleSubscription);

export {
	subscribe,
	checkUpdates,
	upgrade,
	completeUpgrade,
	getCheckUpdates,
	getUpdates,
	getUpgrade
};
