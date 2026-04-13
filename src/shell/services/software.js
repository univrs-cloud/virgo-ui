import Host from 'stores/host';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe: subscribeToUpdates } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['updates']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => properties,
});

const { subscribe: subscribeToUpdate } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['update']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => properties,
});

const checkUpdates = () => {
	return Host.checkUpdates();
};

const update = () => {
	return Host.update();
};

const completeUpdate = () => {
	return Host.completeUpdate();
};

const getCheckUpdates = () => {
	return Host.getCheckUpdates();
};

const getUpdates = () => {
	return Host.getUpdates();
};

const getUpdate = () => {
	return Host.getUpdate();
};

export {
	subscribeToUpdates,
	subscribeToUpdate,
	checkUpdates,
	update,
	completeUpdate,
	getCheckUpdates,
	getUpdates,
	getUpdate
};
