import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['system']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const getSystem = () => {
	return Host.getSystem();
};

const getFQDN = () => {
	const system = getSystem();
	return system?.osInfo?.fqdn || '';
};

const getDomainName = () => {
	return _.replace(getFQDN(), `${getSystem()?.osInfo?.hostname}.`, '');
};

export {
	subscribe,
	getSystem,
	getFQDN,
	getDomainName
};
