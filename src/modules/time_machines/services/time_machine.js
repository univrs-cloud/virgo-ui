import Job from 'stores/job';
import Host from 'stores/host';
import Share from 'stores/share';

let callbackCollection = [];
let storeSubscription = null;

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

const getJobs = () => {
	return Job.getJobs();
};

const getSystem = () => {
	return Host.getSystem();
};

const getTimeMachines = () => {
	return filter(Share.getShares());
};

const createTimeMachine = (config) => {
	config.type = 'timeMachine';
	Share.createShare(config);
};

const updateTimeMachine = (config) => {
	config.type = 'timeMachine';
	Share.updateShare(config);
};

const deleteTimeMachine = (config) => {
	config.type = 'timeMachine';
	Share.deleteShare(config);
};

const handleSubscription = (properties) => {
	const timeMachines = filter(properties.shares);
	const networkInterface = _.find(properties.system.networkInterfaces, { default: true });
	_.each(callbackCollection, (callback) => {
		callback({ timeMachines, networkInterface, jobs: properties.jobs });
	});
};

const subscribe = (callbacks) => {
	if (!storeSubscription) {
		storeSubscription = Share.subscribeToProperties(['shares', 'system', 'jobs'], handleSubscription);
	}
	callbackCollection = _.concat(callbackCollection, callbacks);
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			handleSubscription(_.pick(Share.getState() || {}, ['shares', 'system', 'jobs']));
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
	getJobs,
	getSystem,
	getTimeMachines,
	createTimeMachine,
	updateTimeMachine,
	deleteTimeMachine
};
