import Host from 'stores/host';

let callbackCollection = [];
let subscription = null;

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
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

const reconnectSocket = () => {
	Host.socket.connect();
};

const disconnectSocket = () => {
	Host.socket.disconnect();
};

export {
	subscribe,
	unsubscribe,
	reconnectSocket,
	disconnectSocket
};
