import Share from 'stores/share';

let callbackCollection = [];

const handleSubscription = (updatedProperties) => {
	_.each(callbackCollection, (callback) => {
		callback(updatedProperties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Share.subscribeToProperties(['shares'], handleSubscription);
};

export {
	subscribe
};
