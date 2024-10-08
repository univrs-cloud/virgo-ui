import Store from "./store";

class Host extends Store {
	constructor() {
		const initialState = {
			system: null,
			reboot: null,
			shutdown: null,
			checkUpdates: false,
			updates: null,
			upgrade: -1,
			proxies: null,
			cpu: null,
			memory: null,
			network: null,
			storage: null,
			drives: null,
			ups: null,
			time: null,
			settings: null
		};
		super({
			namespace: 'host'
		});
		
		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			if (this.getStateProperty('reboot') || this.getStateProperty('shutdown') || !_.isNull(this.getStateProperty('upgrade'))) {
				return;
			}

			_.each(_.keys(initialState), (key) => { initialState[key] = false; });
			this.setState(initialState, 'socket_disconnect');
			_.each(_.keys(initialState), (key) => { initialState[key] = null; });
		
		});

		this.socket.on('checkUpdates', (checkUpdates) => {
			this.setState({ checkUpdates }, 'check_updates');
		});

		this.socket.on('updates', (updates) => {
			this.setState({ updates }, 'get_updates');
		});

		this.socket.on('upgrade', (upgrade) => {
			this.setState({ upgrade }, 'upgrade');
		});

		this.socket.on('reboot', (reboot) => {
			this.setState({ reboot }, 'reboot');
		});

		this.socket.on('shutdown', (shutdown) => {
			this.setState({ shutdown }, 'shutdown');
		});

		this.socket.on('system', (system) => {
			this.setState({ system }, 'get_system');
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

		setTimeout(() => {
			let settings = { 'weather': {} };
			this.setState({ settings }, 'get_settings');
		}, 100);
	}

	checkUpdates() {
		this.setState({ checkUpdates: true }, 'check_updates');
		this.socket.emit('checkUpdates');
	}

	upgrade() {
		let upgrade = {};
		this.setState({ upgrade }, 'start_upgrade');
		this.socket.emit('upgrade');
	}

	completeUpgrade() {
		this.socket.emit('completeUpgrade');
	}

	reboot() {
		this.socket.emit('reboot');
	}

	shutdown() {
		this.socket.emit('shutdown');
	}

	getSystem() {
		return this.getStateProperty('system');
	}

	getProxies() {
		return this.getStateProperty('proxies');
	}

	getCheckUpdates() {
		return this.getStateProperty('checkUpdates');
	}

	getUpdates() {
		return this.getStateProperty('updates');
	}

	getUpgrade() {
		return this.getStateProperty('upgrade');
	}

	getSettings() {
		return this.getStateProperty('settings');
	};
}

export default new Host();
