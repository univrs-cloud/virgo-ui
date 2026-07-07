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
		// 			nodeId: 'ab2729a13199f2a7'
		// 		},
		// 		{
		// 			name: 'ceres',
		// 			online: true,
		// 			nodeId: 'c2d7a4766f4d579a'
		// 		}
		// 	];
		// 	this.setState({ nodes }, 'get_nodes');
		// }, 2000);
    }

    getNodes() {
		return this.getStateProperty('nodes');
	}

	deleteNode(config) {
		this.socket.emit('node:delete', config);
	}

	inviteAdmin(config) {
		this.socket.emit('node:invite', config);
	}
}

export default new Node();
