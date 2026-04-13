import Metrics from 'stores/metrics';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe: baseSubscribe } = createSubscription({
	stores: [
		{
			store: Metrics,
			propertyNames: ['metrics']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => ({ metrics: properties.metrics }),
});

const subscribe = (callbacks) => {
	const remove = baseSubscribe(callbacks);
	Metrics.fetch();
	return remove;
};

const fetch = () => {
	Metrics.fetch();
};

const getMetrics = () => {
	return Metrics.getMetrics();
};

const enable = () => {
	Metrics.enable();
};

const disable = () => {
	Metrics.disable();
};

export {
	subscribe,
	fetch,
	getMetrics,
	enable,
	disable
};
