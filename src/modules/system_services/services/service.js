import Job from 'stores/job';
import Host from 'stores/host';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Host,
	propertyNames: ['services', 'jobs'],
	filters: {
		jobs: isSystemServiceJob,
	},
	doubleRaf: true,
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return { services: properties.services, jobs: properties.jobs };
	},
});

function isSystemServiceJob(job) {
	return job?.name && _.startsWith(job.name, 'host:system:service');
}

const getSocket = () => {
	return Host.socket;
};

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isSystemServiceJob);
};

const getServices = () => {
	return Host.getServices();
};

const syncServices = () => {
	Host.syncServices();
};

const performServiceAction = (config) => {
	Host.performServiceAction(config);
};

export {
	subscribe,
	unsubscribe,
	getSocket,
	getJobs,
	getServices,
	syncServices,
	performServiceAction
};
