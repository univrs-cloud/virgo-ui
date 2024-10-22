import Share from 'stores/share';

let callbackCollection = [];

const filter = (shares) => {
	if (_.isNull(shares)) {
		return null;
	}
	
	return _.orderBy(_.filter(shares, { isTimeMachine: false }), ['name'], ['asc']);
}

const getFolders = () => {
	return filter(Share.getShares());
};

const performAction = (config) => {
	Share.performAction(config);
};

const handleSubscription = (properties) => {
	let folders = filter(properties.shares);

	_.each(callbackCollection, (callback) => {
		callback({ folders });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	
	Share.subscribeToProperties(['shares'], handleSubscription);
};

export {
	subscribe,
	getFolders,
	performAction
};
