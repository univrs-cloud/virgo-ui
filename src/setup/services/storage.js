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

/** Drives a pool can be built from: the node has to be able to name one by its stable id before it
 * can be handed to zpool. */
const getUsableDrives = (drives) => {
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

const importPool = (data) => {
	Host.importPool(data);
};

const createPool = (data) => {
	Host.createPool(data);
};

export {
	POOL_NAME,
	POOL_TYPE,
	MINIMUM_DRIVES,
	subscribe,
	getPool,
	getImportablePool,
	getForeignPools,
	getUsableDrives,
	getDrives,
	getImportablePools,
	fetchImportablePools,
	importPool,
	createPool
};
