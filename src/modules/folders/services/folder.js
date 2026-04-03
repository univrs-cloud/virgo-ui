import Host from 'stores/host';
import Share from 'stores/share';

let callbackCollection = [];
let storeSubscription = null;

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

const createFolder = (config) => {
	config.type = 'folder';
	Share.createShare(config);
};

const updateFolder = (config) => {
	config.type = 'folder';
	Share.updateShare(config);
};

const deleteFolder = (config) => {
	config.type = 'folder';
	Share.deleteShare(config);
};

const handleSubscription = (properties) => {
	const folders = filter(properties.shares);
	const networkInterface = _.find(properties.system.networkInterfaces, { default: true });
	_.each(callbackCollection, (callback) => {
		callback({ folders, networkInterface });
	});
};

const subscribe = (callbacks) => {
	if (!storeSubscription) {
		storeSubscription = Share.subscribeToProperties(['shares', 'system'], handleSubscription);
	}
	callbackCollection = _.concat(callbackCollection, callbacks);
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			handleSubscription(_.pick(Share.getState() || {}, ['shares', 'system']));
		});
	});

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
	unsubscribe,
	getSystem,
	getFolders,
	createFolder,
	updateFolder,
	deleteFolder
};
