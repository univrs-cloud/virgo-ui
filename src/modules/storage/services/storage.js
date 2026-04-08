import Host from 'stores/host';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Host,
	propertyNames: ['drives', 'storage', 'snapshots'],
	mapState: (properties) => properties,
	doubleRaf: true,
	attachStore: storeAttach.beforeCallbacks,
});

const getDrives = () => {
	return Host.getDrives();
};

const getStorage = () => {
	return Host.getStorage();
};

const getSnapshots = () => {
	return Host.getSnapshots();
};

export {
	subscribe,
	unsubscribe,
	getDrives,
	getStorage,
	getSnapshots
};
