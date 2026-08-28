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

/** The node's own IPv4 address. A configured virtual IP also sits on this interface, so it is
 * excluded explicitly rather than relying on which address `ip addr` happens to list first. */
const getDefaultInterfaceAddress = (system = getSystem()) => {
	const virtualIp = system?.virtualIp?.address;
	const addresses = _.filter(getDefaultInterface(system)?.addrInfo, { family: 'inet' });
	return _.find(addresses, (address) => { return address.local !== virtualIp; })?.local;
};

/** What the router must forward ports to: the virtual IP when there is one, so replacing a node does
 * not mean reconfiguring the customer's router. */
const getPortForwardAddress = (system = getSystem()) => {
	return system?.virtualIp?.address || getDefaultInterfaceAddress(system);
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

/** The raw peer list, or null while discovery has not answered — `false` is the error state and an
 * empty array is a definite "nothing else is out there". The difference matters: only a definite
 * empty answer may make the virtual IP mandatory. */
const getPeers = (discovery = Host.getDiscovery()) => {
	return (_.isArray(discovery) ? discovery : null);
};

const discoverPeers = () => {
	Host.discoverPeers();
};

/** Peers that already carry a virtual IP. Advisory only: the advertisement is unauthenticated, so it
 * drives a warning in the form and never a refusal — the binding check is the node's own ARP probe. */
const getPeersWithVirtualIp = (discovery = Host.getDiscovery()) => {
	return _.filter(discovery, (peer) => { return Boolean(peer?.virtualIp); });
};

export {
	IDENTIFIER_JOB,
	INTERFACE_JOB,
	subscribe,
	getSystem,
	getDefaultInterface,
	getFqdn,
	getDefaultInterfaceAddress,
	getPortForwardAddress,
	updateHostIdentifier,
	updateInterface,
	discoverPeers,
	getPeers,
	getPeersWithVirtualIp,
	checkDomainAvailability
};
