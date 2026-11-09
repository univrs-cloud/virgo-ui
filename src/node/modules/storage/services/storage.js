import Host from 'stores/host';
import Job from 'stores/job';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['drives', 'storage', 'snapshots']
		},
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		jobs: isExpandJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

function isExpandJob(job) {
	return job?.name === 'host:storage:pool:expand';
}

const getDrives = () => {
	return Host.getDrives();
};

const getStorage = () => {
	return Host.getStorage();
};

const getSnapshots = () => {
	return Host.getSnapshots();
};

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isExpandJob);
};

const syncStorage = () => {
	Host.syncStorage();
};

const expandPool = (data) => {
	Host.expandPool(data);
};

export {
	subscribe,
	getDrives,
	getStorage,
	getSnapshots,
	getJobs,
	syncStorage,
	expandPool
};
