import Job from 'stores/job';
import Configuration from 'stores/configuration';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

function isSettingsModuleJob() {
	return false;
}

const { subscribe } = createSubscription({
	store: Configuration,
	propertyNames: ['configuration', 'jobs'],
	filters: {
		jobs: isSettingsModuleJob,
	},
	doubleRaf: true,
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => properties,
});

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isSettingsModuleJob);
};

const getConfiguration = () => {
	return Configuration.getConfiguration();
};

const updateSmtp = (config) => {
	Configuration.updateSmtp(config);
};

const updateLocation = (config) => {
	Configuration.updateLocation(config);
};

export {
	subscribe,
	unsubscribe,
	getJobs,
	getConfiguration,
	updateSmtp,
	updateLocation
};
