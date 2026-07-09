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
		// 			nodeId: 'ab2729a13199f2a7'
		// 		},
		// 		{
		// 			name: 'asitec',
		// 			online: false,
		// 			isOwner: false,
		// 			nodeId: 'ab2729a13199f2a7',
		// 			lastSeenAt: '2026-07-08T23:04:00Z'
		// 		},
		// 		{
		// 			name: 'ceres-xdjshgfdjhsjhkfgkhdsgfkhjdgshfjkgdhjfgahjsgfdjkhsagfk',
		// 			online: true,
		// 			isOwner: true,
		// 			nodeId: 'c2d7a4766f4d579a',
		// 			admins: [{"email":"robert.gurde@gmail.com","displayName":"Robert Calin"}]
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
}

export default new Node();
