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

	shouldDeferConnect(_namespace) {
		const role = window.virgoRole ?? null;
		if (role === null) {
			return true;
		}
		return role !== 'fleet';
	}

	getNodes() {
		return this.getStateProperty('nodes');
	}

	/** These use an ack callback (unlike other stores' fire-and-forget actions) since the result needs to be reflected inline in a form, not via a subsequent state push. */
	inviteToNode({ nodeId, email }) {
		return new Promise((resolve, reject) => {
			this.socket.emit('nodes:invite', { nodeId, email }, (response) => {
				if (response?.ok) {
					resolve(response);
					return;
				}
				reject(new Error(response?.error || 'Failed to invite user'));
			});
		});
	}

	deleteNode({ nodeId }) {
		return new Promise((resolve, reject) => {
			this.socket.emit('nodes:delete', { nodeId }, (response) => {
				if (response?.ok) {
					resolve(response);
					return;
				}
				reject(new Error(response?.error || 'Failed to delete node'));
			});
		});
	}

	getMembers({ nodeId }) {
		return new Promise((resolve, reject) => {
			this.socket.emit('nodes:members', { nodeId }, (response) => {
				if (response?.ok) {
					resolve(response);
					return;
				}
				reject(new Error(response?.error || 'Failed to load access list'));
			});
		});
	}

	revokeFromNode({ nodeId, email }) {
		return new Promise((resolve, reject) => {
			this.socket.emit('nodes:revoke', { nodeId, email }, (response) => {
				if (response?.ok) {
					resolve(response);
					return;
				}
				reject(new Error(response?.error || 'Failed to revoke access'));
			});
		});
	}
}

export default new Node();
