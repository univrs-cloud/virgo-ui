import Store from 'stores/store';

class Host extends Store {
	constructor() {
		const initialState = {
			system: null,
			reboot: null,
			shutdown: null,
			checkUpdates: false,
			updates: null,
			upgrade: -1,
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
			if (this.getStateProperty('reboot') || this.getStateProperty('shutdown') || !_.isNull(this.getStateProperty('upgrade'))) {
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
			// updates = [{ package: 'package 1', version: { installed: '1.0.0', upgradableTo: '2.0.0' } }];
			this.setState({ updates }, 'get_updates');
		});

		this.socket.on('host:upgrade', (upgrade) => {
			this.setState({ upgrade }, 'get_upgrade');
		});

		this.socket.on('host:reboot', (reboot) => {
			this.setState({ reboot }, 'get_reboot');
		});

		this.socket.on('host:shutdown', (shutdown) => {
			this.setState({ shutdown }, 'get_shutdown');
		});

		this.socket.on('host:system', (system) => {
			this.setState({ system }, 'get_system');
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

	updateDefaultGateway(config) {
		this.socket.emit('host:network:gateway:update', config);
	}

	updateHostIdentifier(config) {
		this.socket.emit('host:network:identifier:update', config);
	}

	updateInterface(config) {
		this.socket.emit('host:network:interface:update', config);
	}

	checkUpdates() {
		this.setState({ checkUpdates: true }, 'check_updates');
		this.socket.emit('host:updates:check');
	}

	upgrade() {
		let upgrade = {};
		this.setState({ upgrade }, 'start_upgrade');
		this.socket.emit('host:upgrade');
	}

	completeUpgrade() {
		this.socket.emit('host:upgrade:complete');
	}

	reboot() {
		this.socket.emit('host:reboot');
	}

	shutDown() {
		this.socket.emit('host:shutdown');
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

	getUpgrade() {
		return this.getStateProperty('upgrade');
	}

	getStorage() {
		return this.getStateProperty('storage');
	}

	getDrives() {
		return this.getStateProperty('drives');
	}
}

export default new Host();
