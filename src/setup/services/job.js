import Job from 'stores/job';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		// A job that has not reported yet carries a plain number, and there is nothing to say about it.
		jobs: (job) => { return job.progress !== 0; }
	},
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

export {
	subscribe
};
