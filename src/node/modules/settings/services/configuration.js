import Job from 'stores/job';
import Configuration from 'stores/configuration';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

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

const updateSmtp = (data) => {
	Configuration.updateSmtp(data);
};

const updateLocation = (data) => {
	Configuration.updateLocation(data);
};

const updateFleet = (data) => {
	Configuration.updateFleet(data);
};

const enableFleet = () => {
	Configuration.enableFleet();
};

const disableFleet = () => {
	Configuration.disableFleet();
};

export {
	subscribe,
	getJobs,
	getConfiguration,
	updateSmtp,
	updateLocation,
	updateFleet,
	enableFleet,
	disableFleet
};
