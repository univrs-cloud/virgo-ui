import Store from "./store";
import { io } from 'socket.io-client';

const socket = io();

class Host extends Store {
	constructor() {
		const initialState = {
			system: null,
			updates: null,
			proxies: null,
			cpu: null,
			memory: null,
			network: null,
			storage: null,
			ups: null,
			time: null
		};
		super();
		
		socket.on('connect', () => {
			this.setState(initialState, 'socket_connect');
		});

		socket.on('disconnect', () => {
			_.each(_.keys(initialState), (key) => { initialState[key] = false; });
			this.setState(initialState, 'socket_disconnect');
			_.each(_.keys(initialState), (key) => { initialState[key] = null; });
		});

		socket.on('system', (system) => {
			this.setState({ system }, 'set_system');
		});

		socket.on('updates', (updates) => {
			this.setState({ updates }, 'set_updates');
		});

		socket.on('proxies', (proxies) => {
			this.setState({ proxies }, 'set_proxies');
		});

		socket.on('cpu', (cpu) => {
			this.setState({ cpu }, 'set_cpu');
		});

		socket.on('memory', (memory) => {
			this.setState({ memory }, 'set_memory');
		});

		socket.on('network', (network) => {
			this.setState({ network }, 'set_network');
		});

		socket.on('storage', (storage) => {
			this.setState({ storage }, 'set_storage');
		});

		socket.on('ups', (ups) => {
			this.setState({ ups }, 'set_ups');
		});

		socket.on('time', (time) => {
			this.setState({ time }, 'set_time');
		});
	}	
}

export default new Host();
