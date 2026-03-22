import Host from 'stores/host';
import Job from 'stores/job';

let callbackCollection = [];
let storeSubscription = null;

const getSocket = () => {
	return Host.socket;
};

const getJobs = () => {
	return Job.getJobs();
};

const getServices = () => {
	return Host.getServices();
};

const syncServices = () => {
	Host.syncServices();
};

const performServiceAction = (config) => {
	Host.performServiceAction(config);
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback({ services: properties.services, jobs: properties.jobs });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	if (!storeSubscription) {
		storeSubscription = Host.subscribeToProperties(['services', 'jobs'], handleSubscription);
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
	getSocket,
	getJobs,
	getServices,
	syncServices,
	performServiceAction
};
