import Host from 'stores/host';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['system']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => properties,
});

const getSystem = () => {
	return Host.getSystem();
};

const getFQDN = () => {
	const system = getSystem();
	return system.osInfo.fqdn;
};

export {
	subscribe,
	unsubscribe,
	getSystem,
	getFQDN
};
