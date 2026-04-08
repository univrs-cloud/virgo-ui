import { ObservableStore } from '@codewithdan/observable-store';
import { ReduxDevToolsExtension } from '@codewithdan/observable-store-extensions';
import { io } from 'socket.io-client';

const digestFilteredJobs = (jobs, jobFilter) => {
	if (!jobFilter) {
		return '';
	}
	
	return _.chain(jobs || [])
		.filter(jobFilter)
		.map((job) => {
			const p = job.progress;
			return [job.id, p?.state, p?.message, job.failedReason].join('\t');
		})
		.sort()
		.value()
		.join('\n');
};

const buildFilteredProperties = (state, propertyNames, filters) => {
	const currentProperties = {};
	propertyNames.forEach((propertyName) => {
		let value = state[propertyName];
		const filterFn = filters?.[propertyName];
		if (filterFn && Array.isArray(value)) {
			value = value.filter(filterFn);
		}
		currentProperties[propertyName] = value;
	});
	return currentProperties;
};

/** Same filtering as `subscribeToProperties` (e.g. for rAF replays that bypass the store callback). */
const pickFilteredStoreSlice = (storeInstance, propertyNames, filters = {}) => {
	return buildFilteredProperties(storeInstance.getState() || {}, propertyNames, filters);
};

ObservableStore.globalSettings = {
	trackStateHistory: false,
	logStateChanges: false
};
ObservableStore.addExtension(new ReduxDevToolsExtension());

class Store extends ObservableStore {
	constructor(settings) {
		super(settings);
		this.socket = io(`/${settings.namespace}`, {
			path: '/api',
			reconnection: true,
			reconnectionAttempts: 30,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000
		});
		this.propertySubscribers = [];
		this.previousState = this.getState() || {};

		this.globalStateWithPropertyChanges.subscribe((stateChange) => {
			if (stateChange === null) {
				return;
			}

			const newState = stateChange.state || {};
			const rawChanges = stateChange.stateChanges;
			const stateChanges =
				rawChanges && typeof rawChanges === 'object' && !Array.isArray(rawChanges) ? rawChanges : {};
			this.propertySubscribers.forEach((subscriber) => {
				const hasChanged = subscriber.properties.some((propertyName) => {
					return Object.prototype.hasOwnProperty.call(stateChanges, propertyName);
				});
				if (!hasChanged) {
					return;
				}

				const filters = subscriber.filters || {};
				const jobFilter = filters.jobs;
				if (jobFilter && subscriber.properties.includes('jobs')) {
					const changedSubscribedKeys = subscriber.properties.filter((propertyName) => {
						return Object.prototype.hasOwnProperty.call(stateChanges, propertyName);
					});
					const onlyJobsChangedAmongSubscribed =
						changedSubscribedKeys.length > 0
						&& changedSubscribedKeys.every((key) => key === 'jobs');
					if (onlyJobsChangedAmongSubscribed) {
						const prevDigest = digestFilteredJobs(this.previousState.jobs, jobFilter);
						const nextDigest = digestFilteredJobs(newState.jobs, jobFilter);
						if (prevDigest === nextDigest) {
							return;
						}
					}
				}

				subscriber.callback(buildFilteredProperties(newState, subscriber.properties, filters));
			});
			this.previousState = newState;
		});
	}

	subscribeToProperties(propertyNames, callback, options = {}) {
		const filters = options.filters || {};
		this.propertySubscribers.push({
			properties: propertyNames,
			callback: callback,
			filters: filters,
		});

		const currentState = this.getState() || {};
		callback(buildFilteredProperties(currentState, propertyNames, filters));

		return () => {
			this.propertySubscribers = this.propertySubscribers.filter(
				(sub) => sub.callback !== callback
			);
		};
	}
}

export default Store;
export {
	pickFilteredStoreSlice,
};
