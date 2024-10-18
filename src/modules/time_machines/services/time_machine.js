import Share from 'stores/share';

let callbackCollection = [];

const filterTimeMachines = (shares) => {
	if (_.isNull(shares)) {
		return null;
	}
	return _.filter(shares, { isTimeMachine: true });
}

const getTimeMachines = () => {
	return filterTimeMachines(Share.getShares());
};

const performAction = (config) => {
	Share.performAction(config);
};

const handleSubscription = (properties) => {
	let timeMachines = filterTimeMachines(properties.shares);

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
