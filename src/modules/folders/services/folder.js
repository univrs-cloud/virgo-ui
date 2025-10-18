import Host from 'stores/host';
import Share from 'stores/share';

let callbackCollection = [];

const filter = (shares) => {
	if (_.isNull(shares)) {
		return null;
	}
	
	return _.orderBy(
		_.filter(shares, { isTimeMachine: false }),
		[(entity) => { return entity.name.toLowerCase(); }],
		['asc']
	);
}

const getSystem = () => {
	return Host.getSystem();
};

const getFolders = () => {
	return filter(Share.getShares());
};

const performAction = (config) => {
	Share.performAction(config);
};

const handleSubscription = (properties) => {
	let folders = filter(properties.shares);
	let networkInterface = properties.system.networkInterface;

	_.each(callbackCollection, (callback) => {
		callback({ folders, networkInterface });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	
	Share.subscribeToProperties(['shares', 'system'], handleSubscription);
};

export {
	subscribe,
	getSystem,
	getFolders,
	performAction
};
