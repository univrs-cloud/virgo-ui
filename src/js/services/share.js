import Share from '../stores/share';

let callbackCollection = [];

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

Share.subscribeToProperties(['shares'], handleSubscription);

export {
	subscribe
};
