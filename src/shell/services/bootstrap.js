import Host from 'stores/host';

let callbackCollection = [];
let subscription = null;

const handleSubscription = (updatedProperties) => {
	_.each(callbackCollection, (callback) => {
		callback(updatedProperties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	
	subscription = Host.subscribeToProperties(['upgrade'], handleSubscription);
};

const unsubscribe = () => {
	if (subscription) {
		subscription();
		subscription = null;
	}
};

export {
	subscribe,
	unsubscribe
};
