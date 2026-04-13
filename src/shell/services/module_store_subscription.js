import { pickFilteredStoreSlice } from 'stores/store';

const storeAttach = {
	/** Register `subscribeToProperties` before callbacks (empty first store delivery). */
	beforeCallbacks: 'beforeCallbacks',
	/** Register after callbacks so the store's first sync sees subscribers (e.g. shell jobs). */
	afterCallbacks: 'afterCallbacks',
};

/** Normalize legacy `{ store, propertyNames }` into the `stores` array form. */
const normalizeStores = ({ store, propertyNames, stores }) => {
	if (stores && store) {
		throw new Error('createSubscription: pass either `store` or `stores`, not both.');
	}
	if (stores) return stores;
	return [{ store, propertyNames }];
};

/** Split a flat `filters` map into per-store filter maps, based on which store owns each property. */
const partitionFilters = (storeEntries, filters) => {
	const perStore = new Map(storeEntries.map((entry) => [entry, {}]));
	if (!filters) return perStore;
	_.each(filters, (filterFn, propertyName) => {
		const owner = _.find(storeEntries, (entry) => _.includes(entry.propertyNames, propertyName));
		if (!owner) {
			throw new Error(`createSubscription: filter for "${propertyName}" has no matching store.`);
		}
		perStore.get(owner)[propertyName] = filterFn;
	});
	return perStore;
};

/** Assert no property name appears in more than one store (merged `properties` would collide). */
const assertUniquePropertyNames = (storeEntries) => {
	const seen = new Set();
	_.each(storeEntries, (entry) => {
		_.each(entry.propertyNames, (name) => {
			if (seen.has(name)) {
				throw new Error(`createSubscription: property "${name}" declared in multiple stores.`);
			}
			seen.add(name);
		});
	});
};

/** Store slice subscription; `filters` (e.g. `{ jobs: (job) => ... }`) are applied in `Store.subscribeToProperties`.
 * Subscribers are registered on the next macrotask so module init can finish before the first delivery.
 * Accepts either `{ store, propertyNames }` (single store) or `{ stores: [{ store, propertyNames }, ...] }` (multi-store). */
const createSubscription = ({
	store,
	propertyNames,
	stores,
	mapState,
	filters,
	attachStore = storeAttach.beforeCallbacks,
}) => {
	const storeEntries = normalizeStores({ store, propertyNames, stores });
	assertUniquePropertyNames(storeEntries);
	const filtersByStore = partitionFilters(storeEntries, filters);

	let callbacks = [];
	const stopFns = new Map(); // entry -> stopFn
	/** Latest merged slice across all stores. Each store delivery patches its own keys in. */
	let mergedProperties = {};

	const deliverMerged = () => {
		const payload = mapState(mergedProperties);
		_.each(callbacks, (callback) => {
			callback(payload);
		});
	};

	const makeStoreDeliver = (entry) => (properties) => {
		mergedProperties = { ...mergedProperties, ...properties };
		deliverMerged();
	};

	const subscribeEntry = (entry) => {
		const entryFilters = filtersByStore.get(entry);
		const options = _.isEmpty(entryFilters) ? {} : { filters: entryFilters };
		return entry.store.subscribeToProperties(entry.propertyNames, makeStoreDeliver(entry), options);
	};

	const attachAllStores = () => {
		_.each(storeEntries, (entry) => {
			if (!stopFns.has(entry)) {
				stopFns.set(entry, subscribeEntry(entry));
			}
		});
	};

	const snapshotMergedSlice = () => {
		return _.reduce(
			storeEntries,
			(acc, entry) => {
				const entryFilters = filtersByStore.get(entry);
				return { ...acc, ...pickFilteredStoreSlice(entry.store, entry.propertyNames, entryFilters || {}) };
			},
			{},
		);
	};

	const addSubscribers = (newCallbacks) => {
		const attachBefore = attachStore === storeAttach.beforeCallbacks;
		const hadStopFns = stopFns.size > 0;

		if (attachBefore && !hadStopFns) {
			attachAllStores();
		}

		callbacks = _.concat(callbacks, newCallbacks);

		if (!attachBefore && !hadStopFns) {
			attachAllStores();
		}

		/* First sync is empty for `beforeCallbacks`; extra subscribers get no store replay without this. */
		const needsCatchUpDeliver = (attachBefore && !hadStopFns) || hadStopFns;
		if (needsCatchUpDeliver && callbacks.length > 0) {
			mergedProperties = snapshotMergedSlice();
			deliverMerged();
		}
	};

	const createUnsubscribe = (removedCallbacks) => {
		return () => {
			callbacks = _.filter(callbacks, (callback) => !_.includes(removedCallbacks, callback));
			if (_.isEmpty(callbacks) && stopFns.size > 0) {
				_.each(Array.from(stopFns.values()), (stopFn) => stopFn());
				stopFns.clear();
				mergedProperties = {};
			}
		};
	};

	return {
		subscribe: (newCallbacks) => {
			let innerUnsubscribe = null;
			const timeoutId = setTimeout(() => {
				addSubscribers(newCallbacks);
				innerUnsubscribe = createUnsubscribe(newCallbacks);
			}, 0);

			return () => {
				clearTimeout(timeoutId);
				if (innerUnsubscribe) {
					innerUnsubscribe();
				}
			};
		},
	};
};

const disposeSubscription = (subscription) => {
	if (subscription) {
		subscription();
	}
};

export {
	createSubscription,
	disposeSubscription,
	storeAttach,
};
