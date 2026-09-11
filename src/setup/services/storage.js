import Host from 'stores/host';
import Job from 'stores/job';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const POOL_NAME = 'messier';
const MINIMUM_DRIVES = 2;
const IMPORT_JOB = 'host:storage:pool:import';
const CREATE_JOB = 'host:storage:pool:create';

function isPoolJob(job) {
	return _.includes([IMPORT_JOB, CREATE_JOB], job?.name);
}

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['storage', 'drives', 'topologies', 'importable']
		},
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		jobs: isPoolJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: ({ storage, drives, topologies, importable, jobs }) => {
		return { storage, drives, topologies, importablePools: importable, jobs };
	}
});

/** This node's pool, already imported and in use. Reads the delivered storage when a render passes
 * one, and falls back to the store for callers with none in hand. */
const getPool = (storage = Host.getStorage()) => {
	return _.find(storage, { name: POOL_NAME });
};

/** This node's pool sitting on the drives unimported — what setup offers to adopt. */
const getImportablePool = (importablePools) => {
	return _.find(importablePools, { name: POOL_NAME });
};

/** Importable pools that aren't this node's: foreign data that creating a new pool would destroy. */
const getForeignPools = (importablePools) => {
	return _.reject(_.filter(importablePools, _.isObject), { name: POOL_NAME });
};

/** Drives a pool can be built from: the node has to be able to name one before it can be handed to
 * zpool, and the drive list already excludes the disk the system runs from. */
const getUsableDrives = (drives) => {
	return _.filter(drives, 'id');
};

/** The layouts the node says these drives can be built into, one per redundancy type. Empty with
 * drives present means they are not all the same size. */
const getTopologies = (topologies = Host.getTopologies()) => {
	return (topologies || []);
};

const flattenVdevs = (vdevs) => {
	return _.flatMap(_.values(vdevs || {}), (vdev) => { return [vdev, ...flattenVdevs(vdev.vdevs)]; });
};

/** The pool's top-level vdevs with the drives under each, shaped for the topology diagram. A vdev with
 * no children is a bare drive standing in for its own group. */
const getPoolGroups = (pool, drives = Host.getDrives()) => {
	const rootVdev = pool?.vdevs?.[pool?.name];
	return _.map(_.values(rootVdev?.vdevs || {}), (vdev) => {
		const disks = _.filter(flattenVdevs(vdev.vdevs), { vdevType: 'disk' });
		return {
			name: vdev.name,
			disks: _.map((_.isEmpty(disks) ? [vdev] : disks), (disk) => {
				return { name: disk.name, drive: _.find(drives, (drive) => { return _.includes(drive.ids, disk.name); }) };
			})
		};
	});
};

const getStorage = () => {
	return Host.getStorage();
};

const getDrives = () => {
	return Host.getDrives();
};

const getImportablePools = () => {
	return Host.getImportable();
};

const fetchImportablePools = () => {
	Host.fetchImportable();
};

const importPool = (data) => {
	Host.importPool(data);
};

const createPool = (data) => {
	Host.createPool(data);
};

export {
	POOL_NAME,
	MINIMUM_DRIVES,
	subscribe,
	getStorage,
	getPool,
	getImportablePool,
	getForeignPools,
	getUsableDrives,
	getTopologies,
	getPoolGroups,
	getDrives,
	getImportablePools,
	fetchImportablePools,
	importPool,
	createPool
};
