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

/** A node is enrolled once it holds a token; the email alone only means an attempt was made. */
const isRegistered = (configuration) => {
	return !_.isEmpty(configuration?.fleet?.token);
};

const updateFleet = (data) => {
	Configuration.updateFleet(data);
};

export {
	REGISTER_JOB,
	subscribe,
	isRegistered,
	updateFleet
};
