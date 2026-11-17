import Job from 'stores/job';
import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Host,
			propertyNames: ['snapshotRules']
		}
	],
	filters: {
		jobs: isSnapshotRulesJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return {
			rules: properties?.snapshotRules ?? null,
			jobs: properties?.jobs || []
		};
	}
});

function isSnapshotRulesJob(job) {
	return _.startsWith(job?.name, 'host:snapshotRules');
}

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isSnapshotRulesJob);
};

const getRules = () => {
	return Host.getSnapshotRules();
};

const createRule = (data) => {
	Host.createSnapshotRule(data);
};

const updateRule = (data) => {
	Host.updateSnapshotRule(data);
};

const deleteRule = (data) => {
	Host.deleteSnapshotRule(data);
};

export {
	subscribe,
	getJobs,
	getRules,
	createRule,
	updateRule,
	deleteRule
};
