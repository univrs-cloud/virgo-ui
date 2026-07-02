import Store from 'stores/store';

class Node extends Store {
	constructor() {
		const initialState = {
			nodes: null
		};
		super({
			namespace: 'node'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('nodes', (nodes) => {
			this.setState({ nodes: nodes || [] }, 'get_nodes');
		});

		this.socket.on('nodes:status', ({ nodeId, online }) => {
			const nodes = this.getNodes();
			if (!nodes?.length || !nodeId) {
				return;
			}
			const updated = nodes.map((node) => {
				if (node.nodeId !== nodeId) {
					return node;
				}
				return { ...node, online: Boolean(online) };
			});
			this.setState({ nodes: updated }, 'node_status');
		});

		this.socket.on('disconnect', () => {
			this.setState({ nodes: null }, 'socket_disconnect');
		});
	}

	getNodes() {
		return this.getStateProperty('nodes');
	}
}

let nodeStore = null;

function getNodeStore() {
	if (!isFleetMode) {
		return null;
	}
	if (!nodeStore) {
		nodeStore = new Node();
	}
	return nodeStore;
}

export {
	getNodeStore
};
