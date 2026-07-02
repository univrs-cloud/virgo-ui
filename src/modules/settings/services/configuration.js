import Job from 'stores/job';
import Configuration from 'stores/configuration';
import { createSubscription, storeAttach } from 'shell/services/module_store_subscription';

function isFleetUpdateJob(job) {
	return job?.name === 'fleet:update';
}

function isSettingsModuleJob(job) {
	return isFleetUpdateJob(job);
}

const getFleetJob = (jobs = []) => {
	return _.find(jobs, isFleetUpdateJob);
};

/** Fleet card state: merges persisted config with live registration job progress. */
const getFleetDisplayState = (configuration, jobs = []) => {
	const fleet = configuration?.fleet || null;
	if (!fleet) {
		return null;
	}

	const fleetJob = getFleetJob(jobs);
	const registering = fleetJob?.progress?.state === 'active';

	return {
		...fleet,
		registering,
		registrationMessage: registering ? (fleetJob.progress?.message || 'Registering with fleet...') : null
	};
};

const { subscribe } = createSubscription({
	stores: [
		{
			store: Configuration,
			propertyNames: ['configuration']
		},
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		jobs: isSettingsModuleJob,
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => properties,
});

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isSettingsModuleJob);
};

const getConfiguration = () => {
	return Configuration.getConfiguration();
};

const updateSmtp = (config) => {
	Configuration.updateSmtp(config);
};

const updateLocation = (config) => {
	Configuration.updateLocation(config);
};

const updateFleet = (config) => {
	Configuration.updateFleet(config);
};

export {
	subscribe,
	getJobs,
	getFleetDisplayState,
	getConfiguration,
	updateSmtp,
	updateLocation,
	updateFleet
};
