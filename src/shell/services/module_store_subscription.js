import { pickFilteredStoreSlice } from 'stores/store';

const storeAttach = {
	/** Register `subscribeToProperties` before callbacks (empty first store delivery). */
	beforeCallbacks: 'beforeCallbacks',
	/** Register after callbacks so the store’s first sync sees subscribers (e.g. shell jobs). */
	afterCallbacks: 'afterCallbacks',
};

/** Store slice subscription; `filters` (e.g. `{ jobs: (job) => ... }`) are applied in `Store.subscribeToProperties`.
 * Subscribers are registered on the next macrotask so module init can finish before the first delivery. */
const createSubscription = ({
	store,
	propertyNames,
	mapState,
	filters,
	attachStore = storeAttach.beforeCallbacks,
}) => {
	let callbacks = [];
	let stopStore = null;

	const deliver = (properties) => {
		const payload = mapState(properties);
		_.each(callbacks, (callback) => {
			callback(payload);
		});
	};

	const hasFilters = filters && !_.isEmpty(filters);
	const subscribeOptions = hasFilters ? { filters } : {};

	const addSubscribers = (newCallbacks) => {
		const attachBefore = attachStore === storeAttach.beforeCallbacks;
		const hadStopStore = !!stopStore;

		if (attachBefore && !stopStore) {
			stopStore = store.subscribeToProperties(propertyNames, deliver, subscribeOptions);
		}

		callbacks = _.concat(callbacks, newCallbacks);

		if (!attachBefore && !stopStore) {
			stopStore = store.subscribeToProperties(propertyNames, deliver, subscribeOptions);
		}

		/* First sync is empty for `beforeCallbacks`; extra subscribers get no store replay without this. */
		const needsCatchUpDeliver = (attachBefore && !hadStopStore) || hadStopStore;
		if (needsCatchUpDeliver && callbacks.length > 0) {
			deliver(pickFilteredStoreSlice(store, propertyNames, filters || {}));
		}
	};

	const createUnsubscribe = (removedCallbacks) => {
		return () => {
			callbacks = _.filter(callbacks, (callback) => !_.includes(removedCallbacks, callback));
			if (_.isEmpty(callbacks) && stopStore) {
				stopStore();
				stopStore = null;
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
