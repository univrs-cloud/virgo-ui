import Job from 'stores/job';

let callbackCollection = [];
let storeSubscription = null;

const handleSubscription = (properties) => {
	const jobs = _.filter(properties.jobs, (job) => { return job.progress !== 0; });
	_.each(callbackCollection, (callback) => {
		callback({ jobs });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	if (!storeSubscription) {
		storeSubscription = Job.subscribeToProperties(['jobs'], handleSubscription);
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
	unsubscribe
};
