import Node from 'stores/node';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const sortNodes = (nodes) => {
	return (_.isNull(nodes) ? nodes : _.orderBy(nodes, [(node) => { return String(node.name ?? '').toLowerCase(); }], ['asc']));
};

const { subscribe } = createSubscription({
	stores: [
		{
			store: Node,
			propertyNames: ['nodes']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return { ...properties, nodes: sortNodes(properties.nodes) };
	}
});

const getNodes = () => {
	return sortNodes(Node.getNodes());
};

export {
	subscribe,
	getNodes
};
