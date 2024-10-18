import Share from 'stores/share';

let callbackCollection = [];

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Share.subscribeToProperties(['shares'], handleSubscription);
};

export {
	subscribe
};
