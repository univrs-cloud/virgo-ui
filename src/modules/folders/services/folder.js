import Job from 'stores/job';
import Host from 'stores/host';
import Share from 'stores/share';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['system']
		},
		{
			store: Share,
			propertyNames: ['shares']
		},
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		jobs: isShareJob,
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		let folders = filterFolders(properties.shares);
		folders = _.map(folders, (folder) => ({
			...folder,
			isCustom: !folder.path?.startsWith('/messier/folders/')
		}));
		const networkInterface = _.find(properties.system.networkInterfaces, { default: true });
		return { folders, networkInterface, jobs: properties.jobs };
	},
});

function isShareJob(job) {
	return job?.name && _.startsWith(job.name, 'share');
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
	return _.filter(Job.getJobs() || [], isShareJob);
};

const getSystem = () => {
	return Host.getSystem();
};

const getFolders = () => {
	const folders = filterFolders(Share.getShares());
	return _.map(folders, (folder) => ({
		...folder,
		isCustom: !folder.path?.startsWith('/messier/folders/')
	}));
};

const getCustomPaths = () => {
	return new Promise((resolve) => {
		Share.socket.once('share:paths:custom', resolve);
		Share.socket.emit('share:paths:custom');
	});
};

const createFolder = (config) => {
	config.type = 'folder';
	Share.createShare(config);
};

const updateFolder = (config) => {
	config.type = 'folder';
	Share.updateShare(config);
};

const deleteFolder = (config) => {
	config.type = 'folder';
	Share.deleteShare(config);
};

export {
	subscribe,
	getJobs,
	getSystem,
	getFolders,
	getCustomPaths,
	createFolder,
	updateFolder,
	deleteFolder
};
