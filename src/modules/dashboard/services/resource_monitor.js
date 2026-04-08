import Host from 'stores/host';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Host,
	propertyNames: ['system', 'cpuStats', 'memory', 'networkStats', 'storage', 'drives', 'ups', 'time'],
	mapState: (properties) => properties,
	attachStore: storeAttach.beforeCallbacks,
});

export {
	subscribe,
	unsubscribe
};
