import Host from '../stores/host';

let callbackCollection = [];

const handleSubscription = (updatedProperties) => {
	_.each(callbackCollection, (callback) => {
		callback(updatedProperties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Host.subscribeToProperties(['cpu', 'memory', 'network', 'storage', 'drives', 'ups', 'time'], handleSubscription);
};

export {
	subscribe
};
