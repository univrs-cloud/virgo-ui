import Host from 'stores/host';
import Job from 'stores/job';
import Docker from 'stores/docker';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const POOL_SECTIONS = ['dedup', 'special', 'logs', 'l2cache', 'spares'];
const BADGED_JOBS = ['app:install', 'app:custom:install', 'app:update', 'app:custom:update', 'app:stack:update', 'app:nextcloud:update', 'app:rollback', 'share:rollback', 'indexer:restore', 'indexer:restore:selection', 'host:storage:pool:create', 'host:storage:pool:expand', 'host:storage:pool:import', 'host:storage:pool:replace'];

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['connected', 'reboot', 'shutdown', 'update', 'updates', 'rebootRequired', 'peerRequests', 'storage', 'drives', 'ups']
		},
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Docker,
			propertyNames: ['containers', 'imageUpdates', 'nextcloud']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		const pools = properties?.storage || [];
		const vdevs = _.flatMap(pools, poolVdevs);
		const watchedDrives = _.filter(properties?.drives, (drive) => { return drive.system || isPoolDrive(drive, vdevs); });
		const driveStatuses = _.map(watchedDrives, (drive) => { return _.toLower(drive.health?.status); });
		const poolHealths = _.map(pools, (pool) => { return _.toLower(pool.properties?.health?.value); });
		const ups = properties?.ups;
		return {
			isConnected: properties?.connected === true,
			isRestarting: properties?.reboot === true || properties?.shutdown === true,
			update: (_.isObject(properties?.update) ? (properties.update.state || 'running') : null),
			isRebootRequired: !_.isEmpty(properties?.rebootRequired),
			hasPeerRequests: !_.isEmpty(properties?.peerRequests),
			hasUpdates: !_.isEmpty(properties?.updates) || !_.isEmpty(properties?.nextcloud?.appUpdates) || _.some(properties?.containers, (container) => { return _.some(properties?.imageUpdates, { containerId: container.id }); }),
			isStorageFaulted: _.some(poolHealths, (health) => { return health && health !== 'online' && health !== 'degraded'; }) || _.includes(driveStatuses, 'critical'),
			isStorageDegraded: _.includes(poolHealths, 'degraded') || _.includes(driveStatuses, 'warning'),
			isOnBattery: _.isObject(ups) && !ups.error && ups.powerSource === 'battery',
			jobs: _.map(_.filter(properties?.jobs, (job) => { return _.includes(BADGED_JOBS, job.name) && _.isObject(job.progress); }), (job) => {
				return { id: job.id, state: job.progress.state };
			})
		};
	}
});

function flattenVdevs(vdevs) {
	return _.flatMap(_.values(vdevs || {}), (vdev) => {
		return [vdev, ...flattenVdevs(vdev.vdevs)];
	});
}

function poolVdevs(pool) {
	return _.flatMap([pool.vdevs?.[pool.name]?.vdevs, ..._.map(POOL_SECTIONS, (key) => { return pool[key]; })], flattenVdevs);
}

function isPoolDrive(drive, vdevs) {
	return _.some(vdevs, (vdev) => { return _.toLower(vdev.vdevType) === 'disk' && _.includes(_.map(drive.ids, _.toLower), _.toLower(vdev.name)); });
}

export {
	subscribe
};
