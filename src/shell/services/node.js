import { getNodeStore } from 'stores/node';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const Node = getNodeStore();

const { subscribe } = Node
	? createSubscription({
		stores: [
			{
				store: Node,
				propertyNames: ['nodes']
			}
		],
		attachStore: storeAttach.afterCallbacks,
		mapState: (properties) => properties,
	})
	: { subscribe: () => { return () => {}; } };

const getNodes = () => {
	return Node?.getNodes() || [];
};

const inviteToNode = (config) => {
	if (!Node) {
		return Promise.reject(new Error('Fleet is not available'));
	}
	return Node.inviteToNode(config);
};

const deleteNode = (config) => {
	if (!Node) {
		return Promise.reject(new Error('Fleet is not available'));
	}
	return Node.deleteNode(config);
};

const getMembers = (config) => {
	if (!Node) {
		return Promise.reject(new Error('Fleet is not available'));
	}
	return Node.getMembers(config);
};

const revokeFromNode = (config) => {
	if (!Node) {
		return Promise.reject(new Error('Fleet is not available'));
	}
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
