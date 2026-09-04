import { ObservableStore } from '@codewithdan/observable-store';
import { ReduxDevToolsExtension } from '@codewithdan/observable-store-extensions';
import SocketTransport from 'libs/socket_transport';
import { forNode, isAvailable } from 'libs/webrtc_transport';

const NAMESPACE_OPEN_TIMEOUT_MS = 8000;

const upgradeToWebrtc = (socket, nodeId, namespace) => {
	if (!isAvailable()) {
		return;
	}

	forNode(nodeId)
		.then((transport) => {
			return transport.channel(namespace).whenConnected(NAMESPACE_OPEN_TIMEOUT_MS)
				.then((channel) => {
					transport.onLost(() => { socket.useSocketIo(); });
					socket.useWebrtc(channel);
				});
		})
		.catch(() => {});
};

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
		const nodeId = new URL(document.baseURI).pathname.match(/^\/nodes\/([^/]+)\//)?.[1] ?? null;
		const fleetOnlyNamespaces = ['runtime', 'node'];
		const proxyable = !fleetOnlyNamespaces.includes(settings.namespace);
		const namespace = (nodeId && proxyable) ? `/fleet/${nodeId}/${settings.namespace}` : `/${settings.namespace}`;
		this.socket = new SocketTransport(namespace, {
			path: '/api',
			reconnection: true,
			reconnectionAttempts: 120,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000
		});
		if (nodeId && proxyable) {
			upgradeToWebrtc(this.socket, nodeId, `/${settings.namespace}`);
		}
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
export { pickFilteredStoreSlice };
