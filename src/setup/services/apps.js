import Docker from 'stores/docker';
import Job from 'stores/job';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

// The node installs these itself once the pool is ready; this step only watches them arrive.
const CORE_APPS = [
	{ name: 'authelia', title: 'Authelia', description: 'Owns the accounts everything else signs in with' },
	{ name: 'traefik', title: 'Traefik', description: 'Answers on this node\'s name and routes to its apps' }
];
const INSTALL_JOB = 'app:install';

function isInstallJob(job) {
	return job?.name === INSTALL_JOB;
}

const { subscribe } = createSubscription({
	stores: [
		{
			store: Docker,
			propertyNames: ['configured']
		},
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		jobs: isInstallJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const isInstalled = (configured) => {
	return _.every(CORE_APPS, (app) => { return !_.isUndefined(_.find(configured, { name: app.name })); });
};

/** What the node reports about one core app: the job while it is being installed, and its entry in
 * the app registry once it is. A job that has settled says nothing more than its outcome. */
const getInstall = (name, configured, jobs) => {
	const job = _.find(jobs, (job) => { return job?.data?.config?.name === name; });
	const isActive = (job?.progress?.state === 'active');
	return {
		isInstalled: !_.isUndefined(_.find(configured, { name })),
		isFailed: (job?.progress?.state === 'failed'),
		message: (isActive ? job?.progress?.message : ''),
		// Only while it runs: the image pull is the long part, and its layers are what there is to watch.
		job: (isActive ? job : undefined),
		failedReason: (job?.progress?.state === 'failed' ? job?.failedReason : '')
	};
};

const getCoreApps = (configured, jobs) => {
	return _.map(CORE_APPS, (app) => {
		return { ...app, ...getInstall(app.name, configured, jobs) };
	});
};

const getConfigured = () => {
	return Docker.getConfigured();
};

export {
	subscribe,
	isInstalled,
	getCoreApps,
	getConfigured
};
