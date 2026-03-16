import Host from 'stores/host';

let callbackCollection = [];
let storeSubscription = null;

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
	if (!storeSubscription) {
		storeSubscription = Host.subscribeToProperties(['drives', 'storage', 'snapshots'], handleSubscription);
	}

	return () => {
		callbackCollection = _.filter(callbackCollection, (callback) => !_.includes(callbacks, callback));
		if (_.isEmpty(callbackCollection) && storeSubscription) {
			storeSubscription();
			storeSubscription = null;
		}
	};
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
