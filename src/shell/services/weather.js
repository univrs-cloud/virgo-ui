import Weather from 'stores/weather';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Weather,
			propertyNames: ['weather']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

export {
	subscribe
};
