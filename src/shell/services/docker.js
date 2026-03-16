import Docker from 'stores/docker';

let callbackCollection = [];
let storeSubscription = null;

const getContainers = () => {
	return Docker.getContainers();
};

const composeUrlFromLabels = (projectContainers) => {
	return Docker.composeUrlFromLabels(projectContainers);
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	if (!storeSubscription) {
		storeSubscription = Docker.subscribeToProperties(['containers', 'update'], handleSubscription);
	}
	
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
	getContainers,
	composeUrlFromLabels
};
