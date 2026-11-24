import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['system', 'discovery', 'peers', 'externalPeers']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const getSystem = () => {
	return Host.getSystem();
};

const getDiscovered = () => {
	return (_.isArray(Host.getDiscovery()) ? Host.getDiscovery() : []);
};

const getPeers = () => {
	return Host.getPeers() || [];
};

const getExternalPeers = () => {
	return Host.getExternalPeers() || [];
};

const adoptPeer = (data) => {
	Host.adoptPeer(data);
};

const adoptExternalPeer = (data) => {
	Host.adoptExternalPeer(data);
};

const removePeer = (data) => {
	Host.removePeer(data);
};

const promoteVirtualIp = () => {
	Host.promoteVirtualIp();
};

const handoverVirtualIp = (data) => {
	Host.handoverVirtualIp(data);
};

export {
	subscribe,
	getSystem,
	getDiscovered,
	getPeers,
	getExternalPeers,
	adoptPeer,
	adoptExternalPeer,
	removePeer,
	promoteVirtualIp,
	handoverVirtualIp,
};
