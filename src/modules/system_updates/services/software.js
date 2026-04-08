import Host from 'stores/host';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Host,
	propertyNames: ['checkUpdates', 'updates'],
	mapState: (properties) => properties,
	attachStore: storeAttach.beforeCallbacks,
});

const getCheckUpdates = () => {
	return Host.getCheckUpdates();
};

const getUpdates = () => {
	return Host.getUpdates();
};

const checkUpdates = () => {
	return Host.checkUpdates();
};

const update = () => {
	return Host.update();
};

export {
	subscribe,
	unsubscribe,
	getCheckUpdates,
	getUpdates,
	checkUpdates,
	update
};
