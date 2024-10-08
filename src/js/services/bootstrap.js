import Host from '../stores/host';

let callbackCollection = [];
let subscription = null;

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
	
	subscription = Host.subscribeToProperties(['upgrade'], handleSubscription);
};

const unsubscribe = () => {
	if (subscription) {
		subscription.unsubscribe();
		subscription = null;
	}
};

export {
	subscribe,
	unsubscribe
};
