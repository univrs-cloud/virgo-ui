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

const getNodeNames = () => {
	return _.map(_.compact([getSystem()?.osInfo?.hostname, ..._.map(Host.getPeers() || [], 'name')]), _.toLower);
};

const getDomainName = () => {
	return _.replace(getFQDN(), `${getSystem()?.osInfo?.hostname}.`, '');
};

export {
	subscribe,
	getSystem,
	getFQDN,
	getDomainName,
	getNodeNames
};
