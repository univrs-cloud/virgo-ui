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
	if (!storeSubscription) {
		storeSubscription = Share.subscribeToProperties(['shares'], handleSubscription);
	}
	callbackCollection = _.concat(callbackCollection, callbacks);
	handleSubscription(_.pick(Share.getState() || {}, ['shares']));

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
