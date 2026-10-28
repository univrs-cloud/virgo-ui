import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['system', 'cpuSensors', 'stats', 'memory', 'arc', 'storage', 'drives', 'ups', 'time']
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
