import Metrics from 'stores/metrics';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe: baseSubscribe } = createSubscription({
	store: Metrics,
	propertyNames: ['metrics'],
	mapState: (properties) => ({ metrics: properties.metrics }),
	attachStore: storeAttach.beforeCallbacks,
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
	unsubscribe,
	fetch,
	getMetrics,
	enable,
	disable
};
