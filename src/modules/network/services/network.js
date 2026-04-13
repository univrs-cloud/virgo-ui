import Job from 'stores/job';
import Host from 'stores/host';
import Configuration from 'stores/configuration';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['system']
		},
		{
			store: Configuration,
			propertyNames: ['configuration']
		},
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		jobs: isTrustedProxyJob,
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => properties,
});

function isTrustedProxyJob(job) {
	return job?.name && _.startsWith(job.name, 'trustedProxy');
}

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isTrustedProxyJob);
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
