import { pickFilteredStoreSlice } from 'stores/store';

const storeAttach = {
	/** Register `subscribeToProperties` before callbacks (empty first store delivery). */
	beforeCallbacks: 'beforeCallbacks',
	/** Register after callbacks so the store’s first sync sees subscribers (e.g. shell jobs). */
	afterCallbacks: 'afterCallbacks',
};

/** Store slice subscription; `filters` (e.g. `{ jobs: (job) => ... }`) are applied in `Store.subscribeToProperties`. */
const createSubscription = ({
	store,
	propertyNames,
	mapState,
	filters,
	doubleRaf = false,
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

	const pickSlice = () => {
		return pickFilteredStoreSlice(store, propertyNames, filters || {});
	};

	const hasFilters = filters && !_.isEmpty(filters);
	const subscribeOptions = hasFilters ? { filters } : {};

	const addSubscribers = (newCallbacks) => {
		const attachBefore = attachStore === storeAttach.beforeCallbacks;

		if (attachBefore && !stopStore) {
			stopStore = store.subscribeToProperties(propertyNames, deliver, subscribeOptions);
		}

		callbacks = _.concat(callbacks, newCallbacks);

		if (!attachBefore && !stopStore) {
			stopStore = store.subscribeToProperties(propertyNames, deliver, subscribeOptions);
		}

		if (doubleRaf) {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					deliver(pickSlice());
				});
			});
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
			addSubscribers(newCallbacks);
			return createUnsubscribe(newCallbacks);
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
