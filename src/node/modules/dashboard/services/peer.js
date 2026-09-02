import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['system', 'discovery', 'peers']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const getDiscovered = () => {
	return (_.isArray(Host.getDiscovery()) ? Host.getDiscovery() : []);
};

const getPeers = () => {
	return Host.getPeers() || [];
};

const adoptPeer = (data) => {
	Host.adoptPeer(data);
};

const removePeer = (data) => {
	Host.removePeer(data);
};

const promoteVirtualIp = () => {
	Host.promoteVirtualIp();
};

const releaseVirtualIp = () => {
	Host.releaseVirtualIp();
};

export {
	subscribe,
	getDiscovered,
	getPeers,
	adoptPeer,
	removePeer,
	promoteVirtualIp,
	releaseVirtualIp,
};
