import Job from 'stores/job';
import Configuration from 'stores/configuration';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

function isSettingsModuleJob() {
	return false;
}

const { subscribe } = createSubscription({
	stores: [
		{
			store: Configuration,
			propertyNames: ['configuration']
		},
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		jobs: isSettingsModuleJob,
	},
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
	getJobs,
	getConfiguration,
	updateSmtp,
	updateLocation
};
