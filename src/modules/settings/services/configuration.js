import Job from 'stores/job';
import Configuration from 'stores/configuration';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

function isSettingsJob() {
	return false;
}

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Configuration,
			propertyNames: ['configuration']
		}
	],
	filters: {
		jobs: isSettingsJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isSettingsJob);
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
