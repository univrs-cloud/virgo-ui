import Runtime from 'stores/runtime';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const FLEET_NAMESPACES = new Set(['user', 'group', 'auth', 'node']);
const FLEET_SOCKET_PATH = '/api/fleet';
const NODE_SOCKET_PATH = '/api';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Runtime,
			propertyNames: ['role']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => properties,
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

function getSocketPath(namespace) {
	if (!isFleetMode()) {
		return NODE_SOCKET_PATH;
	}
	if (FLEET_NAMESPACES.has(namespace)) {
		return FLEET_SOCKET_PATH;
	}
	const nodeId = getSelectedNodeId();
	if (!nodeId) {
		return FLEET_SOCKET_PATH;
	}
	return `${FLEET_SOCKET_PATH}/${nodeId}`;
}

export {
	subscribe,
	getSelectedNodeId,
	setSelectedNodeId,
	isFleetMode,
	getSocketPath,
	FLEET_NAMESPACES
};
