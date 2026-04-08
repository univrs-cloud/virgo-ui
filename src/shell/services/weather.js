import Weather from 'stores/weather';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Weather,
	propertyNames: ['weather'],
	mapState: (properties) => properties,
	attachStore: storeAttach.afterCallbacks,
});

export {
	subscribe,
	unsubscribe
};
