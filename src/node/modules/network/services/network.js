import Job from 'stores/job';
import Host from 'stores/host';
import Configuration from 'stores/configuration';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Host,
			propertyNames: ['system', 'discovery', 'peers']
		},
		{
			store: Configuration,
			propertyNames: ['configuration']
		}
	],
	filters: {
		jobs: isTrustedProxiesJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

function isTrustedProxiesJob(job) {
	return _.startsWith(job?.name, 'trustedProxy');
}

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isTrustedProxiesJob);
};

const getSystem = () => {
	return Host.getSystem();
};

const updateHostIdentifier = (data) => {
	Host.updateHostIdentifier(data);
};

const updateInterface = (data) => {
	Host.updateInterface(data);
};

/** The raw peer list, or null while discovery has not answered — `false` is the error state and an
 * empty array is a definite "nothing else is out there". The difference matters: only a definite
 * empty answer may make the virtual IP mandatory. */
const getDiscovered = () => {
	return (_.isArray(Host.getDiscovery()) ? Host.getDiscovery() : null);
};

const adoptPeer = (data) => {
	Host.adoptPeer(data);
};

const removePeer = (data) => {
	Host.removePeer(data);
};

const getPeers = () => {
	return Host.getPeers() || [];
};

/** Peers that already carry a virtual IP. Advisory only: the advertisement is unauthenticated, so it
 * drives a warning in the form and never a refusal — the binding check is the node's own ARP probe. */
const getDiscoveredWithVirtualIp = () => {
	return _.filter(Host.getDiscovery(), (peer) => { return Boolean(peer?.virtualIp); });
};

const promoteVirtualIp = () => {
	Host.promoteVirtualIp();
};

const releaseVirtualIp = () => {
	Host.releaseVirtualIp();
};

const addTrustedProxy = (data) => {
	Configuration.addTrustedProxy(data);
};

const updateTrustedProxy = (data) => {
	Configuration.updateTrustedProxy(data);
};

const deleteTrustedProxy = (data) => {
	Configuration.deleteTrustedProxy(data);
};

const isTrustedProxyAddressTaken = (address, ignoreAddress) => {
	const trustedProxies = Configuration.getConfiguration()?.trustedProxies || [];
	const normalizedValue = address?.toString().trim().toLowerCase();
	const normalizedIgnore = (ignoreAddress !== undefined && ignoreAddress !== null && ignoreAddress !== '' ? ignoreAddress.toString().trim().toLowerCase() : null);
	return _.some(trustedProxies, (proxy) => {
		const p = proxy?.toString().trim().toLowerCase();
		if (normalizedIgnore !== null && p === normalizedIgnore) {
			return false;
		}
		return p === normalizedValue;
	});
};

export {
	subscribe,
	getJobs,
	getSystem,
	updateHostIdentifier,
	updateInterface,
	adoptPeer,
	removePeer,
	getPeers,
	getDiscovered,
	getDiscoveredWithVirtualIp,
	promoteVirtualIp,
	releaseVirtualIp,
	addTrustedProxy,
	updateTrustedProxy,
	deleteTrustedProxy,
	isTrustedProxyAddressTaken
};
