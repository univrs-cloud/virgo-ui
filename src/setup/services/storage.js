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
	return _.filter(drives, (drive) => { return Boolean(drive.id) && !drive.system; });
};

/** The layouts the node says these drives can be built into, one per redundancy type. Empty with
 * drives present means they are not all the same size. */
const getTopologies = (topologies = Host.getTopologies()) => {
	return (topologies || []);
};

const POOL_SECTION_LABELS = {
	logs: 'Write log',
	special: 'Metadata',
	dedup: 'Dedup metadata',
	l2cache: 'Read cache',
	spares: 'Spares'
};
const STATE_SEVERITY = { green: 0, yellow: 1, red: 2 };

const poolStateColor = (state) => {
	const value = _.toLower(state || '');
	if (!value) {
		return null;
	}

	if (_.includes(['online', 'avail', 'inuse'], value)) {
		return 'green';
	}

	return (value === 'degraded' ? 'yellow' : 'red');
};

const healthColor = (health) => {
	if (health?.status === 'critical') {
		return 'red';
	}

	return (health?.status === 'warning' ? 'orange' : null);
};

const replaceRole = (parent, index, count) => {
	if (!_.includes(['replacing', 'spare'], parent?.vdevType)) {
		return null;
	}

	if (index === 0) {
		return 'old';
	}

	return (index === count - 1 ? 'new' : null);
};

const flattenVdevs = (vdevs, parent = null) => {
	const siblings = _.values(vdevs || {});
	return _.flatMap(siblings, (vdev, index) => {
		const role = replaceRole(parent, index, siblings.length);
		return [{ vdev, role, pair: (role ? parent.vdevType : null) }, ...flattenVdevs(vdev.vdevs, vdev)];
	});
};

const vdevActivity = (vdev, scan) => {
	if (_.toUpper(scan?.state) !== 'SCANNING' || !_.isEmpty(vdev.vdevs) || _.toUpper(vdev.state) !== 'ONLINE') {
		return null;
	}

	if (vdev.scanProcessed > 0) {
		return (_.toUpper(scan.function) === 'RESILVER' ? 'Resilvering' : 'Repairing');
	}

	return (vdev.resilverDeferred ? 'Awaiting resilver' : null);
};

const diskColor = (vdev, drive, activity) => {
	if (activity) {
		return 'text-blue-300';
	}

	const health = healthColor(drive?.health);
	if (health) {
		return `text-${health}-300`;
	}

	return { green: 'text-blue-500', yellow: 'text-yellow-500', red: 'text-red-300' }[poolStateColor(vdev.state)];
};

/** The pool's groups in the order zpool reports them, shaped for the topology diagram: every data
 * vdev on its own, each mirrored log, metadata or dedup vdev on its own, and a section's single drives
 * together. A spare covering a drive is marked where it is listed among the spares. */
const getPoolGroups = (pool, drives = Host.getDrives()) => {
	const rootVdev = pool?.vdevs?.[pool?.name];
	const findDrive = (name) => { return _.find(drives, (drive) => { return _.includes(drive.ids, name); }); };
	const sections = _.filter([
		{ key: 'data', label: 'Data', vdevs: rootVdev?.vdevs },
		..._.map(_.filter(_.keys(pool || {}), (key) => { return _.has(POOL_SECTION_LABELS, key); }), (key) => { return { key, label: POOL_SECTION_LABELS[key], vdevs: pool[key] }; })
	], (section) => { return !_.isEmpty(section.vdevs); });
	const spareUse = {};
	_.each(_.reject(sections, { key: 'spares' }), (section) => {
		_.each(_.values(section.vdevs), (top) => {
			_.each(flattenVdevs(top.vdevs, top), ({ vdev, role, pair }) => {
				if (pair === 'spare' && role === 'new') {
					spareUse[vdev.name] = top.name;
				}
			});
		});
	});
	const toDisk = ({ vdev, role, pair }, isSpare) => {
		const drive = findDrive(vdev.name);
		const activity = vdevActivity(vdev, pool.scanStats);
		const usedIn = (isSpare ? (spareUse[vdev.name] || null) : null);
		const size = (vdev.physSpace || vdev.repDevSize);
		const tip = _.compact([
			(activity || (role === 'old' ? (pair === 'spare' ? 'Covered by spare' : 'Being replaced') : null)),
			(usedIn ? `In use in ${_.escape(usedIn)}` : null),
			(size ? prettyBytes(size, { binary: true }) : null),
			(drive?.health?.message ? _.escape(drive.health.message) : null)
		]).join('<br>');
		return {
			label: (drive?.name ? _.last(drive.name.split('/')) : `…${vdev.name.slice(-6)}`),
			color: diskColor(vdev, drive, activity),
			isFading: Boolean(activity && activity !== 'Awaiting resilver'),
			role,
			usedIn,
			tip
		};
	};
	const groupDisks = (vdev, isSpare = false) => {
		const disks = _.filter(flattenVdevs(vdev.vdevs, vdev), ({ vdev }) => { return vdev.vdevType === 'disk'; });
		return _.map((_.isEmpty(disks) ? [{ vdev, role: null, pair: null }] : disks), (disk) => { return toDisk(disk, isSpare); });
	};

	return _.flatMap(sections, (section) => {
		const vdevs = _.values(section.vdevs);
		if (section.key === 'data') {
			return _.map(vdevs, (vdev) => {
				return { name: (vdev.vdevType === 'disk' ? section.label : `${section.label} · ${vdev.name}`), color: poolStateColor(vdev.state), disks: groupDisks(vdev) };
			});
		}

		const bare = _.filter(vdevs, { vdevType: 'disk' });
		const worst = _.maxBy(bare, (vdev) => { return STATE_SEVERITY[poolStateColor(vdev.state)]; });
		const bareGroup = { name: section.label, color: poolStateColor(worst?.state), disks: _.flatMap(bare, (vdev) => { return groupDisks(vdev, section.key === 'spares'); }) };
		return _.compact(_.map(vdevs, (vdev) => {
			if (vdev.vdevType !== 'disk') {
				return { name: `${section.label} · ${vdev.name}`, color: poolStateColor(vdev.state), disks: groupDisks(vdev) };
			}

			return (vdev === bare[0] ? bareGroup : null);
		}));
	});
};

/** An importable pool arrives in the same shape as an imported one, so it is drawn the same way;
 * cache and spare devices carry no state until the pool is imported. */
const getImportableGroups = (importablePool, drives = Host.getDrives()) => {
	return (importablePool ? getPoolGroups(importablePool, drives) : []);
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
	getImportableGroups,
	getDrives,
	getImportablePools,
	fetchImportablePools,
	importPool,
	createPool
};
