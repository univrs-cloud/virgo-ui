import Store from 'stores/store';

class Host extends Store {
	constructor() {
		const initialState = {
			setupCompleted: null,
			certificate: null,
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
			discovery: null,
			storage: null,
			importable: null,
			snapshots: null,
			drives: null,
			services: null,
			ups: null,
			time: null
		};
		super({
			namespace: 'host'
		});
		
		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			// Expected disconnects — the operation itself drops the socket — must keep the state that
			// drives their overlays/spinners rather than wiping it to initialState. A network-interface
			// reconfigure especially: without this the "configuring" state clears mid-operation.
			if (this.getStateProperty('configuringNetworkInterface')) {
				return;
			}

			if (this.getStateProperty('reboot') || this.getStateProperty('shutdown') || !_.isNull(this.getStateProperty('update'))) {
				return;
			}
			
			this.setState(initialState, 'socket_disconnect');
		});

		this.socket.on('host:setupCompleted', (setupCompleted) => {
			this.setState({ setupCompleted }, 'setup_completed');
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

		this.socket.on('host:certificate', (certificate) => {
			this.setState({ certificate });
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

		this.socket.on('host:discovery', (discovery) => {
			this.setState({ discovery }, 'get_discovery');
		});

		this.socket.on('host:network:stats', (networkStats) => {
			this.setState({ networkStats }, 'get_network_stats');
		});

		this.socket.on('host:drives', (drives) => {
			this.setState({ drives }, 'get_drives');
		});

		this.socket.on('host:storage', (storage) => {
			this.setState({ storage }, 'get_storage');
		});

		this.socket.on('host:storage:importable', (importable) => {
			this.setState({ importable }, 'get_importable');
		});

		this.socket.on('host:storage:snapshots', (snapshots) => {
			this.setState({ snapshots }, 'get_snapshots');
		});

		this.socket.on('host:ups', (ups) => {
			this.setState({ ups }, 'get_ups');
		});

		this.socket.on('host:time', (time) => {
			this.setState({ time }, 'get_time');
		});
	}

	updateHostIdentifier(data) {
		this.socket.emit('host:network:identifier:update', data);
	}
	
	updateInterface(data) {
		this.socket.emit('host:network:interface:update', data);
		this.setState({ 'configuringNetworkInterface': true }, 'set_configuring');
	}

	discoverPeers() {
		this.socket.emit('host:discovery:fetch');
	}

	getDiscovery() {
		return this.getStateProperty('discovery');
	}

	promoteVirtualIp() {
		this.socket.emit('host:network:virtualIp:promote');
	}

	releaseVirtualIp() {
		this.socket.emit('host:network:virtualIp:release');
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

	completeSetup() {
		this.socket.emit('host:setup:complete');
	}

	fetchImportable() {
		this.socket.emit('host:storage:importable:fetch');
	}

	importPool(data) {
		this.socket.emit('host:storage:pool:import', data);
	}

	createPool(data) {
		this.socket.emit('host:storage:pool:create', data);
	}

	installCoreApps() {
		this.socket.emit('host:apps:core:install');
	}

	syncServices() {
		this.setState({ services: null }, 'services_fetch_start');
		this.socket.emit('host:system:services:fetch');
	}

	performServiceAction(data) {
		this.socket.emit(`host:system:service:${data.action}`, { unit: data.unit });
	}

	getCertificate() {
		return this.getStateProperty('certificate');
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

	getDrives() {
		return this.getStateProperty('drives');
	}

	getStorage() {
		return this.getStateProperty('storage');
	}

	getImportable() {
		return this.getStateProperty('importable');
	}

	getSnapshots() {
		return this.getStateProperty('snapshots');
	}

	getServices() {
		return this.getStateProperty('services');
	}
}

export default new Host();
