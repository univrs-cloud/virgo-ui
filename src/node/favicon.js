import * as faviconService from 'node/services/favicon';
import { setBadge } from 'libs/favicon';

const FINISHED_STATES = ['completed', 'succeeded', 'failed'];

let wasConnected = false;
let runningKeys = new Set();
let outcome = null;
let lastState = null;

const trackOutcomes = (activities) => {
	const nextRunningKeys = new Set();
	_.each(activities, ({ key, state }) => {
		if (!_.includes(FINISHED_STATES, state)) {
			nextRunningKeys.add(key);
			return;
		}

		if (!runningKeys.has(key) || !document.hidden) {
			return;
		}

		outcome = ((outcome === 'failed' || state === 'failed') ? 'failed' : 'succeeded');
	});
	runningKeys = nextRunningKeys;
};

const pickBadge = (state) => {
	if (!state.isConnected && wasConnected && runtimeRole === 'fleet') {
		return { color: 'red-500', mark: 'dot' };
	}

	if ((!state.isConnected && wasConnected) || state.isRestarting) {
		return { color: 'gray-400', darkColor: 'gray-200', mark: 'dot' };
	}

	if (state.isStorageFaulted) {
		return { color: 'red-500', mark: 'dot' };
	}

	if (outcome === 'failed') {
		return { color: 'red-500', mark: 'cross' };
	}

	if (state.isStorageDegraded || state.isOnBattery || state.isRebootRequired) {
		return { color: 'orange-500', mark: 'dot' };
	}

	if (runningKeys.size > 0) {
		return { color: 'yellow-500', mark: 'dot' };
	}

	if (state.hasPeerRequests || state.hasUpdates) {
		return { color: 'blue-400', darkColor: 'blue-200', mark: 'dot' };
	}

	if (outcome === 'succeeded') {
		return { color: 'green-500', mark: 'check' };
	}

	return null;
};

const render = (state) => {
	lastState = state;
	if (state.isConnected) {
		wasConnected = true;
	}

	const activities = _.map(state.jobs, (job) => { return { key: `job:${job.id}`, state: job.state }; });
	if (state.update) {
		activities.push({ key: 'update', state: state.update });
	}
	trackOutcomes(activities);
	setBadge(pickBadge(state));
};

document.addEventListener('visibilitychange', () => {
	if (document.hidden || !outcome) {
		return;
	}

	outcome = null;
	if (lastState) {
		setBadge(pickBadge(lastState));
	}
});

faviconService.subscribe([render]);
