import Host from 'stores/host';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Host,
	propertyNames: ['system', 'memory', 'drives'],
	mapState: (properties) => properties,
	doubleRaf: true,
	attachStore: storeAttach.beforeCallbacks,
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
	unsubscribe,
	getSystem,
	getMemory,
	getDrives
};
