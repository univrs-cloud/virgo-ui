import Host from '../stores/host';

let callbackCollection = [];

const upgrade = () => {
	return Host.upgrade();
};

const completeUpgrade = () => {
	return Host.completeUpgrade();
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

Host.subscribeToProperties(['updates', 'upgrade'], handleSubscription);

export {
	subscribe,
	upgrade,
	completeUpgrade
};
