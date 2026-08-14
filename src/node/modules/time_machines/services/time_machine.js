import Job from 'stores/job';
import Host from 'stores/host';
import Share from 'stores/share';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

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
			propertyNames: ['shares']
		}
	],
	filters: {
		jobs: isTimeMachinesJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		const timeMachines = filterTimeMachines(properties?.shares);
		const networkInterface = _.find(properties?.system?.networkInterfaces, { default: true });
		return {
			timeMachines,
			networkInterface,
			jobs: properties?.jobs || []
		};
	}
});

function isTimeMachinesJob(job) {
	return _.startsWith(job?.name, 'share');
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
	return _.filter(Job.getJobs() || [], isTimeMachinesJob);
};

const getSystem = () => {
	return Host.getSystem();
};

const getTimeMachines = () => {
	return filterTimeMachines(Share.getShares());
};

const createTimeMachine = (data) => {
	data.type = 'timeMachine';
	Share.createShare(data);
};

const updateTimeMachine = (data) => {
	data.type = 'timeMachine';
	Share.updateShare(data);
};

const deleteTimeMachine = (data) => {
	data.type = 'timeMachine';
	Share.deleteShare(data);
};

export {
	subscribe,
	getJobs,
	getSystem,
	getTimeMachines,
	createTimeMachine,
	updateTimeMachine,
	deleteTimeMachine
};
