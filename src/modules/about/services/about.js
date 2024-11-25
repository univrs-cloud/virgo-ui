import Host from 'stores/host';

let callbackCollection = [];

const getSystem = () => {
	return Host.getSystem();
};

const getMemory = () => {
	return Host.getMemory();
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

	Host.subscribeToProperties(['system', 'memory', 'drives'], handleSubscription);
};

export {
	subscribe,
	getSystem,
	getMemory,
	getDrives
};
