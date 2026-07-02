import Runtime from 'stores/runtime';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Runtime,
			propertyNames: ['role']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => properties
});

function getSelectedNodeId() {
	return localStorage.getItem('virgo.selectedNodeId') || null;
}

function setSelectedNodeId(nodeId) {
	if (nodeId) {
		localStorage.setItem('virgo.selectedNodeId', nodeId);
	} else {
		localStorage.removeItem('virgo.selectedNodeId');
	}
}

function getRole() {
	return Runtime.getStateProperty('role');
}

function isFleetMode() {
	return getRole() === 'fleet';
}

export {
	subscribe,
	getRole,
	getSelectedNodeId,
	setSelectedNodeId,
	isFleetMode
};
