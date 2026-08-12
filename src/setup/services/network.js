import Host from 'stores/host';
import Job from 'stores/job';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const IDENTIFIER_JOB = 'host:network:identifier:update';
const INTERFACE_JOB = 'host:network:interface:update';

function isNetworkJob(job) {
	return _.includes([IDENTIFIER_JOB, INTERFACE_JOB], job?.name);
}

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['system']
		},
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		jobs: isNetworkJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const getSystem = () => {
	return Host.getSystem();
};

const getDefaultInterface = () => {
	return _.find(getSystem()?.networkInterfaces, { default: true });
};

const updateHostIdentifier = (config) => {
	Host.updateHostIdentifier(config);
};

const updateInterface = (config) => {
	Host.updateInterface(config);
};

export {
	IDENTIFIER_JOB,
	INTERFACE_JOB,
	subscribe,
	getSystem,
	getDefaultInterface,
	updateHostIdentifier,
	updateInterface
};
