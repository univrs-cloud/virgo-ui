import Host from 'stores/host';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe: subscribeToUpdates } = createSubscription({
	store: Host,
	propertyNames: ['updates'],
	mapState: (properties) => properties,
	doubleRaf: false,
	attachStore: storeAttach.afterCallbacks,
});

const { subscribe: subscribeToUpdate } = createSubscription({
	store: Host,
	propertyNames: ['update'],
	mapState: (properties) => properties,
	doubleRaf: false,
	attachStore: storeAttach.afterCallbacks,
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
	unsubscribe,
	checkUpdates,
	update,
	completeUpdate,
	getCheckUpdates,
	getUpdates,
	getUpdate
};
