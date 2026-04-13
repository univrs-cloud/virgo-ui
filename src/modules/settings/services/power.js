import Host from 'stores/host';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['reboot', 'shutdown']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => properties,
});

const reboot = () => {
	return Host.reboot();
};

const shutDown = () => {
	return Host.shutDown();
};

export {
	subscribe,
	unsubscribe,
	reboot,
	shutDown
};
