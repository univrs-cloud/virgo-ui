import Host from 'stores/host';
import Job from 'stores/job';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const POOL_NAME = 'messier';
// Setup only ever builds the two-drive mirror the node ships with; the API accepts other layouts.
const POOL_TYPE = 'mirror';
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
			propertyNames: ['storage', 'drives', 'importable']
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
	mapState: ({ storage, drives, importable, jobs }) => {
		return { storage, drives, importablePools: importable, jobs };
	}
});

/** This node's pool, already imported and in use. */
const findPool = (storage) => {
	return _.find(storage, { name: POOL_NAME });
};

/** This node's pool sitting on the drives unimported — what setup offers to adopt. */
const findImportablePool = (importablePools) => {
	return _.find(importablePools, { name: POOL_NAME });
};

/** Importable pools that aren't this node's: foreign data that creating a new pool would destroy. */
const findForeignPools = (importablePools) => {
	return _.reject(_.filter(importablePools, _.isObject), { name: POOL_NAME });
};

/** Drives a pool can be built from: the node has to be able to name one by its stable id before it
 * can be handed to zpool. */
const findUsableDrives = (drives) => {
	return _.filter(drives, 'eui');
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

const importPool = (config) => {
	Host.importPool(config);
};

const createPool = (config) => {
	Host.createPool(config);
};

export {
	POOL_NAME,
	POOL_TYPE,
	MINIMUM_DRIVES,
	subscribe,
	findPool,
	findImportablePool,
	findForeignPools,
	findUsableDrives,
	getDrives,
	getImportablePools,
	fetchImportablePools,
	importPool,
	createPool
};
