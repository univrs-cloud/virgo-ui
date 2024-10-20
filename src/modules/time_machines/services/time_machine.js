import Share from 'stores/share';

let callbackCollection = [];

const filter = (shares) => {
	if (_.isNull(shares)) {
		return null;
	}
	return _.orderBy(_.filter(shares, { isTimeMachine: true }), ['name'], ['asc']);
}

const getTimeMachines = () => {
	return filter(Share.getShares());
};

const performAction = (config) => {
	Share.performAction(config);
};

const handleSubscription = (properties) => {
	let timeMachines = filter(properties.shares);

	_.each(callbackCollection, (callback) => {
		callback({ timeMachines });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	
	Share.subscribeToProperties(['shares'], handleSubscription);
};

export {
	subscribe,
	getTimeMachines,
	performAction
};
