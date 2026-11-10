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
		jobs: isPoolJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

function isPoolJob(job) {
	return _.includes(['host:storage:pool:expand', 'host:storage:pool:replace'], job?.name);
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
	return _.filter(Job.getJobs() || [], isPoolJob);
};

const syncStorage = () => {
	return Host.syncStorage();
};

const expandPool = (data) => {
	Host.expandPool(data);
};

const replaceDrive = (data) => {
	Host.replaceDrive(data);
};

export {
	subscribe,
	getDrives,
	getStorage,
	getSnapshots,
	getJobs,
	syncStorage,
	expandPool,
	replaceDrive
};
