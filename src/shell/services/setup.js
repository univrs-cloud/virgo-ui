import Host from 'stores/host';

let callbackCollection = [];

const handleSubscription = (properties) => {
    _.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Host.subscribeToProperties(['system', 'storage', 'containers'], handleSubscription);
};

export {
    subscribe
};
