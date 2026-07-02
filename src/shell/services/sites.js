import { waitForNodes } from 'shell/services/node';
import * as runtimeService from 'shell/services/runtime';

const getSites = async () => {
	if (!isFleetMode) {
		return [];
	}

	const nodes = await waitForNodes();
	const selectedNodeId = runtimeService.getSelectedNodeId();

	return nodes.map((node) => {
		return {
			...node,
			selected: node.nodeId === selectedNodeId
		};
	});
};

const selectFirstSiteIfNeeded = async () => {
	if (!isFleetMode || runtimeService.getSelectedNodeId()) {
		return;
	}

	const nodes = await waitForNodes();
	if (!nodes.length) {
		return;
	}

	runtimeService.setSelectedNodeId(nodes[0].nodeId);
	location.reload();
	await new Promise(() => {});
};

export {
	getSites,
	selectFirstSiteIfNeeded
};
