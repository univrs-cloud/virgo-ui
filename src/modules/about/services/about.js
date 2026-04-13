import Host from 'stores/host';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['system', 'memory', 'drives']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => properties,
});

const getSystem = () => {
	return Host.getSystem();
};

const getMemory = () => {
	return Host.getMemory();
};

const getDrives = () => {
	return Host.getDrives();
};

export {
	subscribe,
	getSystem,
	getMemory,
	getDrives
};
