import Node from 'stores/node';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Node,
			propertyNames: ['nodes']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => properties,
});

const getNodes = () => {
	return Node.getNodes();
};

const inviteToNode = (config) => {
	return Node.inviteToNode(config);
};

const deleteNode = (config) => {
	return Node.deleteNode(config);
};

const getMembers = (config) => {
	return Node.getMembers(config);
};

const revokeFromNode = (config) => {
	return Node.revokeFromNode(config);
};

export {
	subscribe,
	getNodes,
	inviteToNode,
	deleteNode,
	getMembers,
	revokeFromNode
};
