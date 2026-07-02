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
	mapState: (properties) => properties,
});

const getNodes = () => {
	return Node.getNodes();
};

const waitForNodes = () => {
	const nodes = Node.getNodes();
	if (nodes !== null) {
		return Promise.resolve(nodes);
	}

	return new Promise((resolve) => {
		const unsubscribe = subscribe([({ nodes: nextNodes }) => {
			if (nextNodes === null) {
				return;
			}
			unsubscribe();
			resolve(nextNodes);
		}]);
	});
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
	waitForNodes,
	inviteToNode,
	deleteNode,
	getMembers,
	revokeFromNode
};
