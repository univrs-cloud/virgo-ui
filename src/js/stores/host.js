import Store from "./store";

class Host extends Store {
	constructor() {
		const initialState = {
			system: null,
			updates: null,
			upgrade: null,
			proxies: null,
			cpu: null,
			memory: null,
			network: null,
			storage: null,
			drives: null,
			ups: null,
			time: null
		};
		super({
			namespace: 'host'
		});
		
		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			_.each(_.keys(initialState), (key) => { initialState[key] = false; });
			this.setState(initialState, 'socket_disconnect');
			_.each(_.keys(initialState), (key) => { initialState[key] = null; });
		});

		this.socket.on('upgrade', (upgrade) => {
			this.setState({ upgrade }, 'upgrade');
		});

		this.socket.on('system', (system) => {
			this.setState({ system }, 'get_system');
		});

		this.socket.on('updates', (updates) => {
			this.setState({ updates }, 'get_updates');
		});

		this.socket.on('proxies', (proxies) => {
			this.setState({ proxies }, 'get_proxies');
		});

		this.socket.on('cpu', (cpu) => {
			this.setState({ cpu }, 'get_cpu');
		});

		this.socket.on('memory', (memory) => {
			this.setState({ memory }, 'get_memory');
		});

		this.socket.on('network', (network) => {
			this.setState({ network }, 'get_network');
		});

		this.socket.on('storage', (storage) => {
			this.setState({ storage }, 'get_storage');
		});

		this.socket.on('drives', (drives) => {
			this.setState({ drives }, 'get_drives');
		});

		this.socket.on('ups', (ups) => {
			this.setState({ ups }, 'get_ups');
		});

		this.socket.on('time', (time) => {
			this.setState({ time }, 'get_time');
		});
	}

	upgrade() {
		let upgrade = {};
		this.setState({ upgrade }, 'start_upgrade');
		this.socket.emit('upgrade');
	}
}

export default new Host();
