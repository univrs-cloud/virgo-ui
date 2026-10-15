import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const POOL_SECTIONS = ['dedup', 'special', 'logs', 'l2cache', 'spares'];

const { subscribe: subscribeToStorageProblems } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['drives', 'storage']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		const vdevs = _.flatMap(properties?.storage, poolVdevs);
		const [systemDrives, dataDrives] = _.partition(properties?.drives, 'system');
		return {
			hasStorageProblems: _.some(properties?.storage, isUnhealthyPool) || _.some(vdevs, hasVdevErrors) || _.some(systemDrives, isUnhealthyDrive) || _.some(dataDrives, (drive) => { return isUnhealthyPoolDrive(drive, vdevs); }),
			isStorageFull: _.some(properties?.storage, isFullPool)
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

function isUnhealthyPool(pool) {
	return _.toLower(pool.properties?.health?.value) !== 'online' || pool.errorCount > 0;
}

function isFullPool(pool) {
	return (pool.properties?.capacity?.value || 0) >= 90;
}

function hasVdevErrors(vdev) {
	return (vdev.readErrors || 0) + (vdev.writeErrors || 0) + (vdev.checksumErrors || 0) > 0;
}

function isUnhealthyDrive(drive) {
	return _.includes(['warning', 'critical'], _.toLower(drive.health?.status));
}

function isUnhealthyPoolDrive(drive, vdevs) {
	return isUnhealthyDrive(drive) && _.some(vdevs, (vdev) => { return _.toLower(vdev.vdevType) === 'disk' && _.includes(_.map(drive.ids, _.toLower), _.toLower(vdev.name)); });
}

export {
	subscribeToStorageProblems
};
