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

        this.socket.on('node:inventory', (nodes) => {
			this.setState({ nodes }, 'get_nodes');
		});

		// setTimeout(() => {
		// 	// const nodes = [];
		// 	const now = Date.now();
		// 	const hour = 60 * 60 * 1000;
		// 	// Build a 24h connectivity track from oldest→newest change points [{ from: hoursAgo, online }].
		// 	const track = (points) => {
		// 		return points.map((point, index) => {
		// 			return {
		// 				startMs: now - point.from * hour,
		// 				endMs: now - (points[index + 1]?.from ?? 0) * hour,
		// 				online: point.online
		// 			};
		// 		});
		// 	};
		// 	const disk = (name, state) => { return { name, vdevType: 'disk', state, path: `/dev/disk/by-id/${name}`, readErrors: 0, writeErrors: 0, checksumErrors: 0 }; };
		// 	// Mirrors the real host:storage payload: top-level state, full properties, and a root → mirror → disk vdev tree.
		// 	const pool = (name, health, capacity, size, scanStats = null, diskStates = ['ONLINE', 'ONLINE']) => {
		// 		const allocated = Math.round(size * capacity / 100);
		// 		return {
		// 			name,
		// 			type: 'POOL',
		// 			state: health,
		// 			poolGuid: 8771284131268622000,
		// 			properties: {
		// 				size: { value: size },
		// 				allocated: { value: allocated },
		// 				free: { value: size - allocated },
		// 				fragmentation: { value: 20 },
		// 				capacity: { value: capacity },
		// 				health: { value: health },
		// 				usedbydatasets: { value: Math.round(allocated * 0.85) },
		// 				usedbysnapshots: { value: Math.round(allocated * 0.15) }
		// 			},
		// 			scanStats,
		// 			vdevs: {
		// 				[name]: {
		// 					name, vdevType: 'root', state: health, allocSpace: allocated, totalSpace: size,
		// 					vdevs: {
		// 						'mirror-0': {
		// 							name: 'mirror-0', vdevType: 'mirror', state: health,
		// 							vdevs: {
		// 								[`${name}-a`]: disk(`nvme-eui.${name}-a`, diskStates[0]),
		// 								[`${name}-b`]: disk(`nvme-eui.${name}-b`, diskStates[1])
		// 							}
		// 						}
		// 					}
		// 				}
		// 			},
		// 			errorCount: 0
		// 		};
		// 	};
		// 	const scrubbed = (hoursAgo, errors = 0) => { return { function: 'SCRUB', state: 'FINISHED', startTime: Math.floor((now - (hoursAgo + 2) * hour) / 1000), endTime: Math.floor((now - hoursAgo * hour) / 1000), errors, processed: errors ? 4e9 : 0, toExamine: 8e12, issued: 8e12, examined: 8e12, scrubPause: 0 }; };
		// 	const scanning = (fn, percent) => { const size = 8e12; return { function: fn, state: 'SCANNING', startTime: Math.floor((now - 40 * 60 * 1000) / 1000), toExamine: size, examined: size * percent / 100, issued: size * percent / 100, processed: 0, errors: 0, scrubPause: 0 }; };
		// 	const nodes = [
		// 		{
		// 			name: 'origin',
		// 			online: true,
		// 			isOwner: true,
		// 			nodeId: '789',
		// 			connectivity: track([{ from: 24, online: true }]),
		// 			storage: [
		// 				pool('messier', 'ONLINE', 72, 8e12, scrubbed(3))
		// 			]
		// 		},
		// 		{
		// 			name: 'ceres-xdjshgfdjhsjhkfgkhdsgfkhjdgshfjkgdhjfgahjsgfdjkhsagfk',
		// 			online: true,
		// 			isOwner: true,
		// 			nodeId: '123',
		// 			// Plex is mid-update (its job spins), Nextcloud is not (it offers Update).
		// 			updates: {
		// 				system: [
		// 					{ package: 'linux-image-amd64', version: { installed: '6.1.106-3', updatableTo: '6.1.112-1' } },
		// 					{ package: 'openssh-server', version: { installed: '1:9.2p1-2+deb12u2', updatableTo: '1:9.2p1-2+deb12u3' } }
		// 				],
		// 				apps: [
		// 					{ name: 'plex', title: 'Plex', services: ['plex', 'transcoder'] },
		// 					{ name: 'nextcloud', title: 'Nextcloud', services: ['app'] }
		// 				]
		// 			},
		// 			appUpdateJobs: [{ data: { config: { name: 'plex' } } }],
		// 			admins: [
		// 				{ "email": "john.doe@gmail.com", "name": "John Doe" },
		// 				{ "email": "jane.doe@gmail.com", "name": "Jane Doe" }
		// 			],
		// 			connectivity: track([{ from: 24, online: true }, { from: 9, online: false }, { from: 8, online: true }]),
		// 			storage: [pool('messier', 'DEGRADED', 58, 16e12, scanning('RESILVER', 25), ['ONLINE', 'DEGRADED'])]
		// 		},
		// 		{
		// 			name: 'nebula',
		// 			online: true,
		// 			isOwner: true,
		// 			nodeId: '234',
		// 			connectivity: track([{ from: 24, online: true }]),
		// 			storage: [
		// 				pool('messier', 'FAULTED', 45, 2e12, null, ['ONLINE', 'UNAVAIL'])
		// 			]
		// 		},
		// 		{
		// 			name: 'vega',
		// 			online: true,
		// 			isOwner: true,
		// 			nodeId: '345',
		// 			update: { state: 'running', stage: 'download', percent: 45 },
		// 			connectivity: track([{ from: 24, online: true }]),
		// 			storage: [pool('messier', 'ONLINE', 88, 500e9)]
		// 		},
		// 		{
		// 			name: 'm87',
		// 			online: false,
		// 			isOwner: false,
		// 			nodeId: '456',
		// 			lastSeenAt: '2026-07-08T23:04:00Z',
		// 			connectivity: track([{ from: 24, online: true }, { from: 5, online: false }])
		// 		},
		// 		{
		// 			name: 'pulsar',
		// 			online: true,
		// 			isOwner: true,
		// 			nodeId: '567',
		// 			connectivity: track([{ from: 24, online: true }, { from: 14, online: false }, { from: 13, online: true }, { from: 6, online: null }, { from: 5, online: true }]),
		// 			storage: [pool('messier', 'ONLINE', 91, 12e12, scanning('SCRUB', 8))]
		// 		}
		// 	];
		// 	this.setState({ nodes }, 'get_nodes');
		// }, 2000);
    }

    getNodes() {
		return this.getStateProperty('nodes');
	}

	deleteNode(config) {
		return this.socket.timeout(10000).emitWithAck('node:delete', config);
	}

	inviteAdmin(config) {
		return this.socket.timeout(10000).emitWithAck('node:invite', config);
	}

	revokeAdmin(config) {
		return this.socket.timeout(10000).emitWithAck('node:revoke', config);
	}

	revokeGroup(config) {
		return this.socket.timeout(10000).emitWithAck('group:node:remove', config);
	}

	startSystemUpdate(config) {
		return this.socket.timeout(10000).emitWithAck('node:update', config);
	}

	completeSystemUpdate(config) {
		return this.socket.timeout(10000).emitWithAck('node:update:complete', config);
	}

	startAppUpdate(config) {
		return this.socket.timeout(10000).emitWithAck('node:app:update', config);
	}
}

export default new Node();
