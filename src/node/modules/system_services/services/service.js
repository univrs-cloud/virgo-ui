import Job from 'stores/job';
import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Host,
			propertyNames: ['services']
		}
	],
	filters: {
		jobs: isSystemServicesJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

function isSystemServicesJob(job) {
	return _.startsWith(job?.name, 'host:system:service');
}

const getSocket = () => {
	return Host.socket;
};

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isSystemServicesJob);
};

const getServices = () => {
	return Host.getServices();
};

const syncServices = () => {
	Host.syncServices();
};

const performServiceAction = (data) => {
	Host.performServiceAction(data);
};

export {
	subscribe,
	getSocket,
	getJobs,
	getServices,
	syncServices,
	performServiceAction
};
