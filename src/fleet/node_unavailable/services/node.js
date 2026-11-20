import Node from 'stores/node';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Node,
			propertyNames: ['nodes']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const getNodes = () => {
	return Node.getNodes();
};

export {
	subscribe,
	getNodes
};
