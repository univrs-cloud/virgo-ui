import Weather from 'stores/weather';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Weather,
			propertyNames: ['weather']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => properties,
});

export {
	subscribe,
	unsubscribe
};
