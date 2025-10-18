import Share from 'stores/share';

let callbackCollection = [];

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

	Share.subscribeToProperties(['shares'], handleSubscription);
};

export {
	subscribe
};
