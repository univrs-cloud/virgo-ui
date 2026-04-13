import Job from 'stores/job';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		jobs: (job) => job.progress !== 0,
	},
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return { jobs: properties.jobs };
	},
});

export {
	subscribe
};
