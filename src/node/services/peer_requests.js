import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['peerRequests']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const acceptPeerRequest = (data) => {
	Host.acceptPeerRequest(data);
};

const denyPeerRequest = (data) => {
	Host.denyPeerRequest(data);
};

const blockPeerRequest = (data) => {
	Host.blockPeerRequest(data);
};

export {
	subscribe,
	acceptPeerRequest,
	denyPeerRequest,
	blockPeerRequest
};
