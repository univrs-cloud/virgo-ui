import { ObservableStore } from '@codewithdan/observable-store';
import { ReduxDevToolsExtension } from '@codewithdan/observable-store-extensions';
import { io } from 'socket.io-client';
import * as runtimeService from 'shell/services/runtime';

const FLEET_NAMESPACES = new Set(['user', 'group', 'auth', 'node']);

const digestFilteredJobs = (jobs, jobFilter) => {
	if (!jobFilter) {
		return '';
	}
	
	return _.chain(jobs || [])
		.filter(jobFilter)
		.map((job) => {
			const progress = job.progress;
			return [job.id, progress?.state, progress?.message, JSON.stringify(progress?.progress || null), job.failedReason].join('\t');
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

/** Same filtering as `subscribeToProperties` (for catch-up delivery when the first sync ran before callbacks were registered). */
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
		this.namespace = settings.namespace;
		this.socket = this.createSocket(this.namespace);
		this.propertySubscribers = [];
		this.previousState = this.getState() || {};

		if (this.shouldDeferConnect(this.namespace)) {
			runtimeService.subscribe([() => {
				if (this.shouldDeferConnect(this.namespace) || this.socket.connected) {
					return;
				}
				this.socket.connect();
			}]);
		}

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

	/** In fleet mode, node-scoped namespaces are proxied through the selected node; everything else
	 * (node role, or fleet-native namespaces) talks to the base API path. */
	getSocketPath(namespace) {
		if (runtimeService.isFleetMode() && !FLEET_NAMESPACES.has(namespace)) {
			const nodeId = runtimeService.getSelectedNodeId();
			if (nodeId) {
				return `/api/fleet/${nodeId}`;
			}
		}
		return '/api';
	}

	shouldDeferConnect(namespace) {
		if (FLEET_NAMESPACES.has(namespace)) {
			return false;
		}
		const role = runtimeService.getRole();
		if (role === null) {
			return true;
		}
		return role === 'fleet' && !runtimeService.getSelectedNodeId();
	}

	/** Opens the store's namespace socket. Overridable so bootstrap stores (e.g. runtime role
	 * detection) can resolve their path differently. */
	createSocket(namespace) {
		const deferred = this.shouldDeferConnect(namespace);
		return io(`/${namespace}`, {
			path: this.getSocketPath(namespace),
			autoConnect: !deferred,
			reconnection: true,
			reconnectionAttempts: 30,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000
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
export { pickFilteredStoreSlice };
