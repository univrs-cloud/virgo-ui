import Host from 'stores/host';
import Indexer from 'stores/indexer';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['system', 'cpuStats', 'networkStats', 'memory', 'storage', 'drives', 'ups', 'time']
		},
		{
			store: Indexer,
			propertyNames: ['indexerStats']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => properties,
});

export {
	subscribe,
	unsubscribe
};
