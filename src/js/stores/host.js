import Store from "./store";

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
		
		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			_.each(_.keys(initialState), (key) => { initialState[key] = false; });
			this.setState(initialState, 'socket_disconnect');
			_.each(_.keys(initialState), (key) => { initialState[key] = null; });
		});

		this.socket.on('system', (system) => {
			this.setState({ system }, 'set_system');
		});

		this.socket.on('updates', (updates) => {
			this.setState({ updates }, 'set_updates');
		});

		this.socket.on('proxies', (proxies) => {
			this.setState({ proxies }, 'set_proxies');
		});

		this.socket.on('cpu', (cpu) => {
			this.setState({ cpu }, 'set_cpu');
		});

		this.socket.on('memory', (memory) => {
			this.setState({ memory }, 'set_memory');
		});

		this.socket.on('network', (network) => {
			this.setState({ network }, 'set_network');
		});

		this.socket.on('storage', (storage) => {
			this.setState({ storage }, 'set_storage');
		});

		this.socket.on('ups', (ups) => {
			this.setState({ ups }, 'set_ups');
		});

		this.socket.on('time', (time) => {
			this.setState({ time }, 'set_time');
		});
	}	
}

export default new Host();
