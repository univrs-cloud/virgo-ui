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

        this.socket.on('disconnect', () => {
			this.setState(initialState, 'socket_disconnect');
		});

        this.socket.on('node:inventory', (nodes) => {
			this.setState({ nodes }, 'get_nodes');
		});

		// setTimeout(() => {
		// 	// const nodes = [];
		// 	const nodes = [
		// 		{
		// 			name: 'origin',
		// 			online: true,
		// 			isOwner: true,
		// 			nodeId: '789'
		// 		},
		// 		{
		// 			name: 'm87',
		// 			online: false,
		// 			isOwner: false,
		// 			nodeId: '456',
		// 			lastSeenAt: '2026-07-08T23:04:00Z'
		// 		},
		// 		{
		// 			name: 'ceres-xdjshgfdjhsjhkfgkhdsgfkhjdgshfjkgdhjfgahjsgfdjkhsagfk',
		// 			online: true,
		// 			isOwner: true,
		// 			nodeId: '123',
		// 			admins: [
		// 				{"email":"john.doe@gmail.com","displayName":"John Doe"},
		// 				{"email":"jane.doe@gmail.com","displayName":"Jane Doe"}
		// 			]
		// 		}
		// 	];
		// 	this.setState({ nodes }, 'get_nodes');
		// }, 2000);
    }

    getNodes() {
		return this.getStateProperty('nodes');
	}

	deleteNode(config) {
		return this.socket.timeout(10000).emitWithAck('node:delete', config);
	}

	inviteAdmin(config) {
		return this.socket.timeout(10000).emitWithAck('node:invite', config);
	}

	revokeAdmin(config) {
		return this.socket.timeout(10000).emitWithAck('node:revoke', config);
	}

	revokeGroup(config) {
		return this.socket.timeout(10000).emitWithAck('group:node:remove', config);
	}
}

export default new Node();
