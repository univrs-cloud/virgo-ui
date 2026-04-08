import Job from 'stores/job';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Job,
	propertyNames: ['jobs'],
	filters: {
		jobs: (job) => job.progress !== 0,
	},
	doubleRaf: false,
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return { jobs: properties.jobs };
	},
});

export {
	subscribe,
	unsubscribe
};
