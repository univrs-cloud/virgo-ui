import Job from 'stores/job';
import Host from 'stores/host';
import Configuration from 'stores/configuration';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const REGISTER_JOB = 'fleet:register';
const FLEET_ZONE = 'univrs.cloud';

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
const getConfiguration = () => {
	return Configuration.getConfiguration();
};

const isRegistered = (configuration = Configuration.getConfiguration()) => {
	return !_.isEmpty(configuration?.fleet?.token);
};

const isRegistrationOptional = (system = Host.getSystem()) => {
	const domainName = _.replace(system?.osInfo?.fqdn || '', `${system?.osInfo?.hostname}.`, '');
	return !_.isEmpty(domainName) && _.toLower(domainName) !== FLEET_ZONE;
};

const updateFleet = (data) => {
	Configuration.updateFleet(data);
};

const installCoreApps = () => {
	Host.installCoreApps();
};

export {
	REGISTER_JOB,
	subscribe,
	getConfiguration,
	isRegistered,
	isRegistrationOptional,
	updateFleet,
	installCoreApps
};
