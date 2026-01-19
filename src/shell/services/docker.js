import Docker from 'stores/docker';

let callbackCollection = [];

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
	return Docker.subscribeToProperties(['containers', 'update'], handleSubscription);
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
