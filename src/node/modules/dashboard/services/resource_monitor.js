import Host from 'stores/host';
import Indexer from 'stores/indexer';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

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
	mapState: (properties) => {
		return properties;
	}
});

export {
	subscribe
};
