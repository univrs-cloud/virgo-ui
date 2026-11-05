import Job from 'stores/job';
import Host from 'stores/host';
import Share from 'stores/share';
import User from 'stores/user';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const DEFAULT_NETWORK_INTERFACE_SPEED_BPS = 1_000_000_000;

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Host,
			propertyNames: ['system']
		},
		{
			store: Share,
			propertyNames: ['shares', 'clients']
		},
		{
			store: User,
			propertyNames: ['users']
		}
	],
	filters: {
		jobs: isBackupDisksJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		const backupDisks = composeBackupDisks(properties?.shares, properties?.clients);
		const networkInterface = _.find(properties?.system?.networkInterfaces, { default: true });
		return {
			backupDisks,
			networkInterface,
			jobs: properties?.jobs || []
		};
	}
});

function isBackupDisksJob(job) {
	return _.startsWith(job?.name, 'share');
}

function composeBackupDisks(shares, clients) {
	const backupDisks = filterBackupDisks(shares);
	if (_.isNull(backupDisks)) {
		return null;
	}

	return _.map(backupDisks, (backupDisk) => {
		const backupDiskClients = getBackupDiskClients(backupDisk, clients);
		return {
			...backupDisk,
			clients: backupDiskClients,
			network: { rx: _.sumBy(backupDiskClients, 'rx'), tx: _.sumBy(backupDiskClients, 'tx') }
		};
	});
}

function getBackupDiskClients(backupDisk, clients) {
	const name = _.toLower(backupDisk.name);
	const sessions = _.map((_.isArray(clients) ? clients : []), (session) => {
		return { ...session, shares: _.uniq(_.map(session.shares, _.toLower)) };
	});
	return _.sortBy(_.map(_.groupBy(_.filter(sessions, (session) => { return _.includes(session.shares, name); }), 'address'), (group, address) => {
		return {
			address,
			usernames: _.sortBy(_.uniq(_.map(group, 'username')), _.toLower),
			rx: _.sumBy(group, (session) => { return (session.rx || 0) / _.size(session.shares); }),
			tx: _.sumBy(group, (session) => { return (session.tx || 0) / _.size(session.shares); })
		};
	}), 'address');
}

function filterBackupDisks(shares) {
	if (_.isNull(shares)) {
		return null;
	}

	return _.orderBy(
		_.filter(shares, { isBackupDisk: true }),
		[(entity) => { return entity.name.toLowerCase(); }],
		['asc']
	);
}

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isBackupDisksJob);
};

const getSystem = () => {
	return Host.getSystem();
};

const getBackupDisks = () => {
	return composeBackupDisks(Share.getShares(), Share.getClients());
};

const getDefaultNetworkInterface = () => {
	return _.find(Host.getSystem()?.networkInterfaces, { default: true });
};

const getDefaultNetworkInterfaceSpeed = () => {
	return ((getDefaultNetworkInterface()?.speed || (DEFAULT_NETWORK_INTERFACE_SPEED_BPS / 1_000_000)) * 1_000_000 / 8);
};

const createBackupDisk = (data) => {
	data.type = 'backupDisk';
	Share.createShare(data);
};

const updateBackupDisk = (data) => {
	data.type = 'backupDisk';
	Share.updateShare(data);
};

const deleteBackupDisk = (data) => {
	data.type = 'backupDisk';
	Share.deleteShare(data);
};

export {
	subscribe,
	getJobs,
	getSystem,
	getBackupDisks,
	getDefaultNetworkInterface,
	getDefaultNetworkInterfaceSpeed,
	createBackupDisk,
	updateBackupDisk,
	deleteBackupDisk
};
