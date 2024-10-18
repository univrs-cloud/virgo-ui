import Share from 'stores/share';

let callbackCollection = [];

const filterSmbShares = (shares) => {
	if (_.isNull(shares)) {
		return null;
	}
	return _.orderBy(_.filter(shares, { isTimeMachine: false }), ['name'], ['asv']);
}

const getShares = () => {
	return filterSmbShares(Share.getShares());
};

const performAction = (config) => {
	Share.performAction(config);
};

const handleSubscription = (properties) => {
	let smbShares = filterSmbShares(properties.shares);

	_.each(callbackCollection, (callback) => {
		callback({ smbShares });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	
	Share.subscribeToProperties(['shares'], handleSubscription);
};

export {
	subscribe,
	getShares,
	performAction
};
