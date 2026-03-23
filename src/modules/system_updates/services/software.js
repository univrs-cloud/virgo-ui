import Host from 'stores/host';

let callbackCollection = [];
let storeSubscription = null;

const getCheckUpdates = () => {
	return Host.getCheckUpdates();
};

const getUpdates = () => {
	return Host.getUpdates();
};

const checkUpdates = () => {
	return Host.checkUpdates();
};

const update = () => {
	return Host.update();
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	if (!storeSubscription) {
		storeSubscription = Host.subscribeToProperties(['checkUpdates', 'updates'], handleSubscription);
	}
	callbackCollection = _.concat(callbackCollection, callbacks);
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			handleSubscription(_.pick(Host.getState() || {}, ['checkUpdates', 'updates']));
		});
	});

	return () => {
		callbackCollection = _.filter(callbackCollection, (callback) => !_.includes(callbacks, callback));
		if (_.isEmpty(callbackCollection) && storeSubscription) {
			storeSubscription();
			storeSubscription = null;
		}
	};
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe,
	getCheckUpdates,
	getUpdates,
	checkUpdates,
	update
};
