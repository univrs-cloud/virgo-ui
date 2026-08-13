import Docker from 'stores/docker';
import Job from 'stores/job';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

// The node installs these itself once the pool is ready; this step only watches them arrive.
const CORE_APPS = [
	{ name: 'authelia', title: 'Authelia', description: 'Owns the accounts everything else signs in with' },
	{ name: 'traefik', title: 'Traefik', description: 'Answers on this node\'s name and routes to its apps' }
];
const INSTALL_JOB = 'app:install';
const RUNNING_STATES = ['running', 'restarting'];

function isInstallJob(job) {
	return job?.name === INSTALL_JOB;
}

const { subscribe } = createSubscription({
	stores: [
		{
			store: Docker,
			propertyNames: ['configured', 'containers']
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

/** Both stacks start with a one-shot container that exits once it has done its work, so what says an
 * app is up is its own service: the one named after it. */
const isAppRunning = (name, containers) => {
	const container = _.find(containers, (container) => {
		return container?.labels?.comDockerComposeProject === name && container?.labels?.comDockerComposeService === name;
	});
	return _.includes(RUNNING_STATES, container?.state);
};

/** A registry row only says the app was installed at some point. The wizard cannot move on until both
 * apps are actually answering, so being listed and being up are both required. */
const isReady = (configured = Docker.getConfigured(), containers = Docker.getContainers()) => {
	return _.every(CORE_APPS, (app) => {
		return !_.isUndefined(_.find(configured, { name: app.name })) && isAppRunning(app.name, containers);
	});
};

/** What the node reports about one core app: the job while it is being installed, its entry in the app
 * registry, and its containers. An imported pool lists both apps from the start and they are installed
 * again over it, so a running job outranks the registry — otherwise the work would look done while it
 * is still downloading. */
const getInstall = (name, configured, containers, jobs) => {
	const job = _.find(jobs, (job) => { return job?.data?.config?.name === name; });
	const isInstalling = !_.isUndefined(job) && !_.includes(['completed', 'failed'], job?.progress?.state);
	return {
		isInstalling,
		isReady: !_.isUndefined(_.find(configured, { name })) && isAppRunning(name, containers),
		isFailed: (job?.progress?.state === 'failed'),
		message: (isInstalling ? job?.progress?.message : ''),
		job: (isInstalling ? job : undefined),
		failedReason: (job?.progress?.state === 'failed' ? job?.failedReason : '')
	};
};

const getCoreApps = (configured, containers, jobs) => {
	return _.map(CORE_APPS, (app) => {
		return { ...app, ...getInstall(app.name, configured, containers, jobs) };
	});
};

const getConfigured = () => {
	return Docker.getConfigured();
};

export {
	subscribe,
	isReady,
	getCoreApps,
	getConfigured
};
