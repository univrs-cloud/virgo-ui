import Job from 'stores/job';
import Host from 'stores/host';
import Share from 'stores/share';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Share,
	propertyNames: ['shares', 'system', 'jobs'],
	filters: {
		jobs: isShareJob,
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		const folders = filterFolders(properties.shares);
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
	return filterFolders(Share.getShares());
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
	unsubscribe,
	getJobs,
	getSystem,
	getFolders,
	createFolder,
	updateFolder,
	deleteFolder
};
