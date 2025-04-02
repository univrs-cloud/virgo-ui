import Job from 'stores/job';

let callbackCollection = [];
let subscription = null;

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);

	subscription = Job.subscribeToProperties(['jobs'], handleSubscription);
};

export {
	subscribe
};
