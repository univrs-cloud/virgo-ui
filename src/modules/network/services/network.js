import Job from 'stores/job';
import Host from 'stores/host';
import Configuration from 'stores/configuration';

let callbackCollection = [];
let storeSubscription = null;

const getJobs = () => {
	return Job.getJobs();
};

const getSystem = () => {
	return Host.getSystem();
};

const updateHostIdentifier = (config) => {
	Host.updateHostIdentifier(config);
};

const updateInterface = (config) => {
	Host.updateInterface(config);
};

const addTrustedProxy = (config) => {
	Configuration.addTrustedProxy(config);
};

const updateTrustedProxy = (config) => {
	Configuration.updateTrustedProxy(config);
};

const deleteTrustedProxy = (config) => {
	Configuration.deleteTrustedProxy(config);
};

const isTrustedProxyAddressTaken = (address, ignoreAddress) => {
	const trustedProxies = Configuration.getConfiguration()?.trustedProxies || [];
	const normalizedValue = address?.toString().trim().toLowerCase();
	const normalizedIgnore = (ignoreAddress !== undefined && ignoreAddress !== null && ignoreAddress !== '' ? ignoreAddress.toString().trim().toLowerCase() : null);
	return _.some(trustedProxies, (proxy) => {
		const p = proxy?.toString().trim().toLowerCase();
		if (normalizedIgnore !== null && p === normalizedIgnore) {
			return false;
		}
		return p === normalizedValue;
	});
};

const handleSubscription = (properties) => {
	_.each(callbackCollection, (callback) => {
		callback(properties);
	});
};

const subscribe = (callbacks) => {
	if (!storeSubscription) {
		storeSubscription = Host.subscribeToProperties(['system', 'configuration', 'jobs'], handleSubscription);
	}
	callbackCollection = _.concat(callbackCollection, callbacks);
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			handleSubscription(_.pick(Host.getState() || {}, ['system', 'configuration', 'jobs']));
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
	updateHostIdentifier,
	updateInterface,
	addTrustedProxy,
	updateTrustedProxy,
	deleteTrustedProxy,
	isTrustedProxyAddressTaken
};
