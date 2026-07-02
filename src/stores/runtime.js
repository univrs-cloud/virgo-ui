import { ObservableStore } from '@codewithdan/observable-store';
import { io } from 'socket.io-client';

const SOCKET_PATHS = ['/api/fleet', '/api'];

class Runtime extends ObservableStore {
	#socket = null;
	#pathIndex = 0;

	constructor() {
		super({});
		this.setState({ role: null }, 'init');
		this.#connect();
	}

	#connect() {
		if (this.#pathIndex >= SOCKET_PATHS.length) {
			this.setState({ role: 'node' }, 'runtime_fallback');
			return;
		}

		const path = SOCKET_PATHS[this.#pathIndex++];
		this.#socket = io('/runtime', {
			path,
			reconnection: false,
			timeout: 5000
		});

		this.#socket.on('runtime', (config) => {
			this.setState({ role: config.role || 'node' }, 'runtime');
			this.#socket.disconnect();
			this.#socket = null;
		});

		this.#socket.on('connect_error', () => {
			this.#socket?.disconnect();
			this.#socket = null;
			this.#connect();
		});
	}

	subscribeToProperties(propertyNames, callback) {
		const deliver = (state) => {
			const properties = {};
			propertyNames.forEach((propertyName) => {
				properties[propertyName] = state?.[propertyName];
			});
			callback(properties);
		};

		const subscription = this.globalStateWithPropertyChanges.subscribe((change) => {
			if (change === null) {
				return;
			}
			const stateChanges = change.stateChanges || {};
			const hasChanged = propertyNames.some((propertyName) => {
				return Object.prototype.hasOwnProperty.call(stateChanges, propertyName);
			});
			if (hasChanged) {
				deliver(change.state);
			}
		});

		deliver(this.getState() || {});

		return () => subscription.unsubscribe();
	}
}

export default new Runtime();
