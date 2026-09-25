import Job from 'stores/job';
import Host from 'stores/host';
import Configuration from 'stores/configuration';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const FLEET_ZONE = 'univrs.cloud';

function isSettingsJob() {
	return false;
}

function isFleetDomain(fqdn) {
	return _.endsWith(String(fqdn || '').toLowerCase(), `.${FLEET_ZONE}`);
}

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Host,
			propertyNames: ['system']
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
		return {
			...properties,
			fleetRequired: isFleetDomain(properties?.system?.osInfo?.fqdn)
		};
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
