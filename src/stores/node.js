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

        this.socket.on('nodes', (nodes) => {
			this.setState({ nodes }, 'get_nodes');
		});
    }

    getNodes() {
		return this.getStateProperty('nodes');
	}
}

export default new Node();
