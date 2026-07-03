import Host from 'stores/host';
import Node from 'stores/node';
// import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const getNodes = () => {
    const system = Host.getSystem();
    const node = system.osInfo?.fqdn || '';
	return [
		node
	];
};

export {
    getNodes
};
