import Host from 'stores/host';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Host,
	propertyNames: ['setupCompleted', 'update'],
	mapState: (properties) => properties,
	attachStore: storeAttach.afterCallbacks,
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
	subscribe,
	unsubscribe
};
