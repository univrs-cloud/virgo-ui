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

function isFleetMode() {
	return Runtime.getStateProperty('role') === 'fleet';
}

export {
	subscribe,
	getSelectedNodeId,
	setSelectedNodeId,
	isFleetMode
};
