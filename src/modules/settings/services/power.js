import Host from 'stores/host';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Host,
	propertyNames: ['reboot', 'shutdown'],
	mapState: (properties) => properties,
	attachStore: storeAttach.beforeCallbacks,
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
