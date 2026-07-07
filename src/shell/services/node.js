import Node from 'stores/node';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

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

const deleteNode = (config) => {
	return Node.deleteNode(config);
};

const inviteAdmin = (config) => {
	return Node.inviteAdmin(config);
};

export {
	subscribe,
	getNodes,
	deleteNode,
	inviteAdmin
};
