import Host from 'stores/host';
import Docker from 'stores/docker';

let callbackCollection = [];

const getContainers = () => {
	return Docker.getContainers();
};

const composeUrlFromLabels = (labels) => {
	return Docker.composeUrlFromLabels(labels);
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	Docker.subscribeToProperties(['containers', 'upgrade'], handleSubscription);
};

export {
	subscribe,
	getContainers,
	composeUrlFromLabels
};
