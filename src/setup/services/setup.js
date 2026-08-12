import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['setupCompleted', 'system']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const completeSetup = () => {
	Host.completeSetup();
};

export {
	subscribe,
	completeSetup
};
