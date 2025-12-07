import Store from 'stores/store';

class Host extends Store {
	constructor() {
		const initialState = {
			system: null,
			configuringNetworkInterface: false,
			reboot: null,
			shutdown: null,
			checkUpdates: false,
			updates: null,
			update: -1,
			cpuStats: null,
			memory: null,
			networkStats: null,
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
			if (this.getStateProperty('configuringNetworkInterface')) {
				return;
			}

			if (this.getStateProperty('reboot') || this.getStateProperty('shutdown') || !_.isNull(this.getStateProperty('update'))) {
				return;
			}

			_.each(_.keys(initialState), (key) => { initialState[key] = false; });
			this.setState(initialState, 'socket_disconnect');
			_.each(_.keys(initialState), (key) => { initialState[key] = null; });
		
		});

		this.socket.on('host:updates:check', (checkUpdates) => {
			this.setState({ checkUpdates }, 'check_updates');
		});

		this.socket.on('host:updates', (updates) => {
			// updates = [{ package: 'package 1', version: { installed: '1.0.0', updatableTo: '2.0.0' } }];
			this.setState({ updates }, 'get_updates');
		});

		this.socket.on('host:update', (update) => {
			this.setState({ update }, 'get_update');
		});

		this.socket.on('host:reboot', (reboot) => {
			this.setState({ reboot }, 'get_reboot');
		});

		this.socket.on('host:shutdown', (shutdown) => {
			this.setState({ shutdown }, 'get_shutdown');
		});

		this.socket.on('host:system', (system) => {
			this.setState({ system }, 'get_system');
			this.setState({ 'configuringNetworkInterface': false }, 'set_configuring');
		});

		this.socket.on('host:system:services', (services) => {
			this.setState({ services }, 'get_services');
		});

		this.socket.on('host:cpu:stats', (cpuStats) => {
			this.setState({ cpuStats }, 'get_cpu_stats');
		});

		this.socket.on('host:memory', (memory) => {
			this.setState({ memory }, 'get_memory');
		});

		this.socket.on('host:network:stats', (networkStats) => {
			this.setState({ networkStats }, 'get_network_stats');
		});

		this.socket.on('host:storage', (storage) => {
			this.setState({ storage }, 'get_storage');
		});

		this.socket.on('host:drives', (drives) => {
			this.setState({ drives }, 'get_drives');
		});

		this.socket.on('host:ups', (ups) => {
			this.setState({ ups }, 'get_ups');
		});

		this.socket.on('host:time', (time) => {
			this.setState({ time }, 'get_time');
		});
	}

	updateHostIdentifier(config) {
		this.socket.emit('host:network:identifier:update', config);
	}
	
	updateInterface(config) {
		this.socket.emit('host:network:interface:update', config);
		this.setState({ 'configuringNetworkInterface': true }, 'set_configuring');
	}

	checkUpdates() {
		this.setState({ checkUpdates: true }, 'check_updates');
		this.socket.emit('host:updates:check');
	}

	update() {
		let update = {};
		this.setState({ update }, 'start_update');
		this.socket.emit('host:update');
	}

	completeUpdate() {
		this.socket.emit('host:update:complete');
	}

	reboot() {
		this.socket.emit('host:reboot');
	}

	shutDown() {
		this.socket.emit('host:shutdown');
	}

	syncServices() {
		this.socket.emit('host:system:services:fetch');
	}

	getSystem() {
		return this.getStateProperty('system');
	}

	getMemory() {
		return this.getStateProperty('memory');
	}

	getCheckUpdates() {
		return this.getStateProperty('checkUpdates');
	}

	getUpdates() {
		return this.getStateProperty('updates');
	}

	getUpdate() {
		return this.getStateProperty('update');
	}

	getStorage() {
		return this.getStateProperty('storage');
	}

	getDrives() {
		return this.getStateProperty('drives');
	}

	getServices() {
		return this.getStateProperty('services');
	}
}

export default new Host();
