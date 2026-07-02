import { io } from 'socket.io-client';
import Store from 'stores/store';

class Runtime extends Store {
	constructor() {
		const initialState = {
			role: null
		};
		super({ namespace: 'runtime' });

		this.setState(initialState, 'socket_connect');

		this.socket.on('runtime', (config) => {
			const role = config.role || 'node';
			if (this.getStateProperty('role') === role) {
				return;
			}
			this.setState({ role }, 'runtime');
		});
	}

	/** Runtime detection is the bootstrap that determines the role every other store's path depends
	 * on, so it can't derive its own path from the role. It always connects to the base API path and
	 * just listens for the role the server emits on connection (no requests, no probing). */
	createSocket(namespace) {
		return io(`/${namespace}`, {
			path: '/api',
			reconnection: true,
			reconnectionAttempts: 30,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000
		});
	}
}

export default new Runtime();
