import Host from 'stores/host';
import Configuration from 'stores/configuration';
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

// Each of these reads the delivered system when a render passes one, and falls back to the store for
// callers with no payload in hand, such as a submit handler.

/** The interface this node answers on — the only one setup configures. */
const getDefaultInterface = (system = getSystem()) => {
	return _.find(system?.networkInterfaces, { default: true });
};

/** hostname.domain — the name the node answers to once setup is finished. */
const getFqdn = (system = getSystem()) => {
	return system?.osInfo?.fqdn || '';
};

/** The IPv4 address that interface currently holds, which is what a router forwards ports to. */
const getDefaultInterfaceAddress = (system = getSystem()) => {
	return _.find(getDefaultInterface(system)?.addrInfo, { family: 'inet' })?.local;
};

const updateHostIdentifier = (data) => {
	Host.updateHostIdentifier(data);
};

const checkDomainAvailability = (label) => {
	return Configuration.checkDomainAvailability(label);
};

const updateInterface = (data) => {
	Host.updateInterface(data);
};

export {
	IDENTIFIER_JOB,
	INTERFACE_JOB,
	subscribe,
	getSystem,
	getDefaultInterface,
	getFqdn,
	getDefaultInterfaceAddress,
	updateHostIdentifier,
	updateInterface,
	checkDomainAvailability
};
