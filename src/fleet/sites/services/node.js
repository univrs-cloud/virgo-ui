import Node from 'stores/node';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const VIEW_KEY = 'fleet:sitesView';

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

const getView = () => {
	let view;
	try {
		view = localStorage.getItem(VIEW_KEY);
	} catch (error) {
		view = null;
	}
	return (view === 'table' ? 'table' : 'cards');
};

const setView = (view) => {
	try {
		localStorage.setItem(VIEW_KEY, view);
	} catch (error) {
		return;
	}
};

const deleteNode = (data) => {
	return Node.deleteNode(data);
};

const inviteAdmin = (data) => {
	return Node.inviteAdmin(data);
};

const revokeAdmin = (data) => {
	return Node.revokeAdmin(data);
};

const revokeGroup = (data) => {
	return Node.revokeGroup(data);
};

const startSystemUpdate = (data) => {
	return Node.startSystemUpdate(data);
};

const completeSystemUpdate = (data) => {
	return Node.completeSystemUpdate(data);
};

const startAppUpdate = (data) => {
	return Node.startAppUpdate(data);
};

export {
	subscribe,
	getNodes,
	getView,
	setView,
	deleteNode,
	inviteAdmin,
	revokeAdmin,
	revokeGroup,
	startSystemUpdate,
	completeSystemUpdate,
	startAppUpdate
};
