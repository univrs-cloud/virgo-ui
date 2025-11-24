import Host from 'stores/host';
import Share from 'stores/share';

let callbackCollection = [];

const filter = (shares) => {
	if (_.isNull(shares)) {
		return null;
	}
	
	return _.orderBy(
		_.filter(shares, { isTimeMachine: true }),
		[(entity) => { return entity.name.toLowerCase(); }],
		['asc']
	);
}

const getSystem = () => {
	return Host.getSystem();
};

const getTimeMachines = () => {
	return filter(Share.getShares());
};

const performAction = (config) => {
	Share.performAction(config);
};

const handleSubscription = (properties) => {
	const timeMachines = filter(properties.shares);
	const networkInterface = properties.system.networkInterface;
	_.each(callbackCollection, (callback) => {
		callback({ timeMachines, networkInterface });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	
	return Share.subscribeToProperties(['shares', 'system'], handleSubscription);
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe,
	getSystem,
	getTimeMachines,
	performAction
};
