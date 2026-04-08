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
		const timeMachines = filterTimeMachines(properties.shares);
		const networkInterface = _.find(properties.system.networkInterfaces, { default: true });
		return { timeMachines, networkInterface, jobs: properties.jobs };
	},
});

function isShareJob(job) {
	return job?.name && _.startsWith(job.name, 'share');
}

function filterTimeMachines(shares) {
	if (_.isNull(shares)) {
		return null;
	}

	return _.orderBy(
		_.filter(shares, { isTimeMachine: true }),
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

const getTimeMachines = () => {
	return filterTimeMachines(Share.getShares());
};

const createTimeMachine = (config) => {
	config.type = 'timeMachine';
	Share.createShare(config);
};

const updateTimeMachine = (config) => {
	config.type = 'timeMachine';
	Share.updateShare(config);
};

const deleteTimeMachine = (config) => {
	config.type = 'timeMachine';
	Share.deleteShare(config);
};

export {
	subscribe,
	unsubscribe,
	getJobs,
	getSystem,
	getTimeMachines,
	createTimeMachine,
	updateTimeMachine,
	deleteTimeMachine
};
