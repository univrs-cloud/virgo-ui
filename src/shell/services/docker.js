import Job from 'stores/job';
import Docker from 'stores/docker';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Docker,
	propertyNames: ['containers', 'update'],
	mapState: (properties) => properties,
	doubleRaf: false,
	attachStore: storeAttach.afterCallbacks,
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
