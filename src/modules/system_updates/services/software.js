import Host from 'stores/host';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['checkUpdates', 'updates']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => properties,
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
	getCheckUpdates,
	getUpdates,
	checkUpdates,
	update
};
