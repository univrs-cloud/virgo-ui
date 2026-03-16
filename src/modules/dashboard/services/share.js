import Share from 'stores/share';

let callbackCollection = [];
let storeSubscription = null;

const handleSubscription = (properties) => {
	let shares = _.orderBy(
		properties.shares,
		[(entity) => { return entity.comment.toLowerCase(); }],
		['asc']
	);
	_.each(callbackCollection, (callback) => {
		callback({ shares });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	if (!storeSubscription) {
		storeSubscription = Share.subscribeToProperties(['shares'], handleSubscription);
	}

	return () => {
		callbackCollection = _.filter(callbackCollection, (callback) => !_.includes(callbacks, callback));
		if (_.isEmpty(callbackCollection) && storeSubscription) {
			storeSubscription();
			storeSubscription = null;
		}
	};
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe
};
