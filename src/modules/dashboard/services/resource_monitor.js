import Host from 'stores/host';
import Indexer from 'stores/indexer'; // Need to init store
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Host,
	propertyNames: ['system', 'cpuStats', 'networkStats', 'indexerStats', 'memory', 'storage', 'drives', 'ups', 'time'],
	mapState: (properties) => properties,
	attachStore: storeAttach.beforeCallbacks,
});

export {
	subscribe,
	unsubscribe
};
