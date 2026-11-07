import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['reboot', 'shutdown']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const { subscribe: subscribeToRebootRequired } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['rebootRequired', 'reboot']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const reboot = () => {
	return Host.reboot();
};

const shutDown = () => {
	return Host.shutDown();
};

export {
	subscribe,
	subscribeToRebootRequired,
	reboot,
	shutDown
};
