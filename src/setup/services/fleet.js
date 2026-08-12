import Job from 'stores/job';
import Configuration from 'stores/configuration';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const REGISTER_JOB = 'fleet:register';

function isFleetJob(job) {
	return job?.name === REGISTER_JOB;
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
		jobs: isFleetJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const getConfiguration = () => {
	return Configuration.getConfiguration();
};

const updateFleet = (config) => {
	Configuration.updateFleet(config);
};

export {
	REGISTER_JOB,
	subscribe,
	getConfiguration,
	updateFleet
};
