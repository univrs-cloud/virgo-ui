import Job from 'stores/job';

let callbackCollection = [];
let subscription = null;

const handleSubscription = (properties) => {
	const jobs = _.filter(properties.jobs, (job) => { return job.progress !== 0; });
	_.each(callbackCollection, (callback) => {
		callback({ jobs });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	subscription = Job.subscribeToProperties(['jobs'], handleSubscription);
};

export {
	subscribe
};
