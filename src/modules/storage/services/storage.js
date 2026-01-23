import Host from 'stores/host';

let callbackCollection = [];

const getDrives = () => {
	return Host.getDrives();
};

const getStorage = () => {
	return Host.getStorage();
};

const getSnapshots = () => {
	return Host.getSnapshots();
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	return Host.subscribeToProperties(['drives', 'storage', 'snapshots'], handleSubscription);
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe,
	getDrives,
	getStorage,
	getSnapshots
};
