import Job from 'stores/job';

let callbackCollection = [];

const handleSubscription = (properties) => {
	const jobs = _.filter(properties.jobs, (job) => { return job.progress !== 0; });
	_.each(callbackCollection, (callback) => {
		callback({ jobs });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	return Job.subscribeToProperties(['jobs'], handleSubscription);
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
