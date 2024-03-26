import Host from '../stores/host';

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

Host.subscribeToProperties(['updates'], handleSubscription);

export {
	subscribe
};
