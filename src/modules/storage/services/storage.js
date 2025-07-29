import Host from 'stores/host';

let callbackCollection = [];

const getStorage = () => {
	return Host.getStorage();
};

const getDrives = () => {
	return Host.getDrives();
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Host.subscribeToProperties(['drives', 'storage'], handleSubscription);
};

export {
	subscribe,
	getStorage,
	getDrives
};
