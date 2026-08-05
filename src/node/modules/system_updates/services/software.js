import Host from 'stores/host';
import Job from 'stores/job';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

function isAppUpdateJob(job) {
	return job?.name === 'app:update';
}

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['checkUpdates', 'updates']
		},
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		jobs: isAppUpdateJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return { ...properties, hasUpdatingApps: !_.isEmpty(properties?.jobs) };
	}
});

const getCheckUpdates = () => {
	return Host.getCheckUpdates();
};

const getUpdates = () => {
	return Host.getUpdates();
};

const checkUpdates = () => {
	return Host.checkUpdates();
};

const update = () => {
	return Host.update();
};

export {
	subscribe,
	getCheckUpdates,
	getUpdates,
	checkUpdates,
	update
};
