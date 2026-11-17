import Job from 'stores/job';
import Host from 'stores/host';
import Docker from 'stores/docker';
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
			propertyNames: ['snapshotRules', 'snapshots']
		},
		{
			store: Docker,
			propertyNames: ['configured']
		},
		{
			store: Share,
			propertyNames: ['shares']
		}
	],
	filters: {
		jobs: isSnapshotRulesJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return {
			rules: composeRules(properties?.snapshotRules, properties?.configured, properties?.shares, properties?.snapshots),
			jobs: properties?.jobs || []
		};
	}
});

function composeRules(rules, configured, shares, snapshots) {
	if (_.isNull(rules) || _.isUndefined(rules) || rules === false) {
		return rules ?? null;
	}

	const apps = _.map(_.filter(configured, (entry) => { return entry.type === 'app' && Boolean(entry.dataset) && Boolean(entry.snapshotPolicy); }), (app) => {
		return { type: 'app', name: app.name, title: app.title, icon: app.icon, dataset: app.dataset, policy: app.snapshotPolicy };
	});
	const folders = _.map(_.filter(shares, (share) => { return !share.isBackupDisk && Boolean(share.dataset) && Boolean(share.snapshotPolicy); }), (share) => {
		return { type: 'folder', name: share.name, title: share.comment, icon: null, dataset: share.dataset, policy: share.snapshotPolicy };
	});
	return _.map(rules, (rule) => {
		const members = _.filter([...apps, ...folders], (member) => {
			return _.toLower(member.policy.mode) !== 'disabled' && _.toLower(member.policy.rule) === _.toLower(rule.name);
		});
		return {
			...rule,
			members: _.map(members, (member) => {
				return {
					type: member.type,
					name: member.name,
					title: member.title,
					icon: member.icon,
					mode: _.toLower(member.policy.mode),
					snapshots: _.filter(_.values(snapshots), (snapshot) => { return _.toLower(snapshot.dataset) === _.toLower(member.dataset); })
				};
			})
		};
	});
}

function isSnapshotRulesJob(job) {
	return _.startsWith(job?.name, 'host:snapshotRules');
}

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isSnapshotRulesJob);
};

const getRules = () => {
	return composeRules(Host.getSnapshotRules(), Docker.getConfigured(), Share.getShares(), Host.getSnapshots());
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
