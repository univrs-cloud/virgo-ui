import Job from 'stores/job';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const getParentId = (job) => {
	return job?.parent?.id || _.last(_.split(job?.parentKey || '', ':')) || null;
};

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		// A job that has not reported yet carries a plain number, and there is nothing to say about it.
		// The apps step reports the core installs in its own card, so they are left out of the toasts.
		jobs: (job) => { return job.progress !== 0 && (job.name !== 'app:install' || !_.isNil(getParentId(job))); }
	},
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

export {
	subscribe,
	getParentId
};
