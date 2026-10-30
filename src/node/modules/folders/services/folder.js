import Job from 'stores/job';
import Docker from 'stores/docker';
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
			propertyNames: ['system', 'snapshots']
		},
		{
			store: Docker,
			propertyNames: ['configured']
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
		jobs: isFoldersJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		const folders = composeFolders(properties?.shares, properties?.clients, properties?.snapshots, properties?.configured);
		const networkInterface = _.find(properties?.system?.networkInterfaces, { default: true });
		return {
			folders,
			networkInterface,
			jobs: properties?.jobs || []
		};
	}
});

function isFoldersJob(job) {
	return _.startsWith(job?.name, 'share');
}

function composeFolders(shares, clients, snapshots, configured) {
	const folders = filterFolders(shares);
	if (_.isNull(folders)) {
		return null;
	}

	return _.map(folders, (folder) => {
		const folderClients = getFolderClients(folder, clients);
		const snapshotSource = getSnapshotSource(folder, configured);
		return {
			...folder,
			...snapshotSource,
			isCustom: !folder.path?.startsWith('/messier/folders/'),
			clients: folderClients,
			snapshots: _.filter(_.values(snapshots), (snapshot) => { return Boolean(snapshotSource.snapshotDataset) && _.toLower(snapshot.dataset) === _.toLower(snapshotSource.snapshotDataset); }),
			network: { rx: _.sumBy(folderClients, 'rx'), tx: _.sumBy(folderClients, 'tx') }
		};
	});
}

function getSnapshotSource(folder, configured) {
	if (folder.snapshotPolicy) {
		return { snapshotDataset: folder.dataset, snapshotSource: null, snapshotBrowse: { dataset: folder.dataset, root: '' }, canChangeSnapshots: true };
	}

	const folderPath = `${_.toLower(folder.path)}/`;
	const app = _.find(configured, (entry) => { return entry.type === 'app' && Boolean(entry.dataset) && _.startsWith(folderPath, `/${_.toLower(entry.dataset)}/`); });
	if (!app) {
		return { snapshotDataset: null, snapshotSource: null, snapshotBrowse: null, canChangeSnapshots: false };
	}

	const relativePath = folder.path.slice(app.dataset.length + 1);
	const snapshotBrowse = (_.toLower(app.name) === 'nextcloud' && /^\/data\/[^/]+\/files$/.test(relativePath) ? { dataset: '', root: relativePath } : null);
	return { snapshotPolicy: app.snapshotPolicy || null, snapshotDataset: app.dataset, snapshotSource: app.title, snapshotBrowse, canChangeSnapshots: false };
}

function getFolderClients(folder, clients) {
	const name = _.toLower(folder.name);
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

function filterFolders(shares) {
	if (_.isNull(shares)) {
		return null;
	}

	return _.orderBy(
		_.filter(shares, { isTimeMachine: false }),
		[(entity) => { return entity.name.toLowerCase(); }],
		['asc']
	);
}

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isFoldersJob);
};

const getSystem = () => {
	return Host.getSystem();
};

const getFolders = () => {
	return composeFolders(Share.getShares(), Share.getClients(), Host.getSnapshots(), Docker.getConfigured());
};

const getDefaultNetworkInterface = () => {
	return _.find(Host.getSystem()?.networkInterfaces, { default: true });
};

const getDefaultNetworkInterfaceSpeed = () => {
	return ((getDefaultNetworkInterface()?.speed || (DEFAULT_NETWORK_INTERFACE_SPEED_BPS / 1_000_000)) * 1_000_000 / 8);
};

const getCustomPaths = () => {
	return new Promise((resolve) => {
		Share.socket.once('share:paths:custom', resolve);
		Share.socket.emit('share:paths:custom');
	});
};

const createFolder = (data) => {
	data.type = 'folder';
	Share.createShare(data);
};

const updateFolder = (data) => {
	data.type = 'folder';
	Share.updateShare(data);
};

const deleteFolder = (data) => {
	data.type = 'folder';
	Share.deleteShare(data);
};

const updateFolderSnapshots = (data) => {
	Share.updateSnapshots(data);
};

export {
	subscribe,
	getJobs,
	getSystem,
	getFolders,
	getDefaultNetworkInterface,
	getDefaultNetworkInterfaceSpeed,
	getCustomPaths,
	createFolder,
	updateFolder,
	deleteFolder,
	updateFolderSnapshots
};
