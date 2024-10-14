import Host from '../stores/host';

let callbackCollection = [];
let subscription = null;

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

	subscription = Host.subscribeToProperties(['system'], handleSubscription);
};

const unsubscribe = () => {
	if (subscription) {
		subscription();
		subscription = null;
	}
};

export {
	subscribe,
	unsubscribe,
	getSystem
};
