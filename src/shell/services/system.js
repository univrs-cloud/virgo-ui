import Host from 'stores/host';
import { getNodeStore } from 'stores/node';
import * as runtimeService from 'shell/services/runtime';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['system']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => properties,
});

const getSystem = () => {
	return Host.getSystem();
};

const getFQDN = () => {
	const system = getSystem();
	return system?.osInfo?.fqdn || '';
};

const getSites = async () => {
	if (!isFleetMode) {
		return [];
	}

	const Node = getNodeStore();
	if (!Node) {
		return [];
	}

	const nodes = Node.getNodes() || [];

	const selectedNodeId = runtimeService.getSelectedNodeId();
	let selected = selectedNodeId;
	if (!selected && nodes.length) {
		selected = nodes[0].nodeId;
		runtimeService.setSelectedNodeId(selected);
		// A page reload is required so boot-time flags derived from the selected node
		// (e.g. isAdmin for that node's system pages) are recomputed for this first pick.
		location.reload();
	}

	return nodes.map((node) => {
		return {
			...node,
			selected: node.nodeId === selected
		};
	});
};

export {
	subscribe,
	getSystem,
	getFQDN,
	getSites
};
