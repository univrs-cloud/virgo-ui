import Job from 'stores/job';
import Host from 'stores/host';
import Docker from 'stores/docker';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['update']
		},
		{
			store: Docker,
			propertyNames: ['containers']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => properties,
});

const getJobs = () => {
	return Job.getJobs();
};

const getContainers = () => {
	return Docker.getContainers();
};

const composeUrlFromLabels = (projectContainers) => {
	return Docker.composeUrlFromLabels(projectContainers);
};

export {
	subscribe,
	unsubscribe,
	getJobs,
	getContainers,
	composeUrlFromLabels
};
