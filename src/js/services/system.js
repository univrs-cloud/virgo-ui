import Host from '../stores/host';

let callbackCollection = [];

const getSystem = () => {
	return Host.getSystem();
};

const handleSubscription = (updatedProperties) => {
	_.each(callbackCollection, (callback) => {
		callback(updatedProperties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Host.subscribeToProperties(['system'], handleSubscription);
};

export {
	subscribe,
	getSystem
};
