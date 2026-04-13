import Host from 'stores/host';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['drives', 'storage', 'snapshots']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => properties,
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
	getDrives,
	getStorage,
	getSnapshots
};
