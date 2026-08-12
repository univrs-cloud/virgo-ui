import Host from 'stores/host';
import Job from 'stores/job';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const POOL_NAME = 'messier';
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
	mapState: (properties) => {
		return properties;
	}
});

const getStorage = () => {
	return Host.getStorage();
};

const getDrives = () => {
	return Host.getDrives();
};

const getImportable = () => {
	return Host.getImportable();
};

/** This node's pool, already imported and in use. */
const getPool = () => {
	return _.find(getStorage(), { name: POOL_NAME });
};

/** This node's pool sitting on the drives unimported — what setup offers to adopt. */
const getImportablePool = () => {
	return _.find(getImportable(), { name: POOL_NAME });
};

/** Importable pools that aren't this node's: foreign data that creating a new pool would destroy. */
const getForeignPools = () => {
	return _.reject(_.filter(getImportable(), _.isObject), { name: POOL_NAME });
};

const fetchImportable = () => {
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
	IMPORT_JOB,
	CREATE_JOB,
	subscribe,
	getStorage,
	getDrives,
	getImportable,
	getPool,
	getImportablePool,
	getForeignPools,
	fetchImportable,
	importPool,
	createPool
};
