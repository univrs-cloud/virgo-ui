import Host from 'stores/host';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['setupCompleted', 'update']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => properties,
});

const reconnectSocket = () => {
	Host.socket.connect();
};

const disconnectSocket = () => {
	Host.socket.disconnect();
};

window.addEventListener('beforeunload', (event) => {
	disconnectSocket();
});

document.addEventListener('visibilitychange', (event) => {
	if (document.visibilityState === 'visible') {
		reconnectSocket();
	}
});

export {
	subscribe
};
