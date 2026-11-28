import * as faviconService from 'fleet/services/favicon';
import { setBadge } from 'libs/favicon';

let runningNodeIds = new Set();
let outcome = null;
let lastState = null;

const trackOutcomes = (updates) => {
	const nextRunningNodeIds = new Set();
	_.each(updates, ({ nodeId, state }) => {
		if (state === 'running') {
			nextRunningNodeIds.add(nodeId);
			return;
		}

		if (!runningNodeIds.has(nodeId) || !document.hidden) {
			return;
		}

		outcome = ((outcome === 'failed' || state === 'failed') ? 'failed' : 'succeeded');
	});
	runningNodeIds = nextRunningNodeIds;
};

const pickBadge = (state) => {
	if (state.hasOfflineNode || state.isStorageFaulted) {
		return { color: 'red-500', mark: 'dot' };
	}

	if (outcome === 'failed') {
		return { color: 'red-500', mark: 'cross' };
	}

	if (state.isStorageDegraded || state.isOnBattery) {
		return { color: 'orange-500', mark: 'dot' };
	}

	if (runningNodeIds.size > 0 || !_.isEmpty(state.appUpdateJobIds)) {
		return { color: 'yellow-500', mark: 'dot' };
	}

	if (state.hasUpdates) {
		return { color: 'blue-400', darkColor: 'blue-200', mark: 'dot' };
	}

	if (outcome === 'succeeded') {
		return { color: 'green-500', mark: 'check' };
	}

	return null;
};

const render = (state) => {
	lastState = state;
	trackOutcomes(state.updates);
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
