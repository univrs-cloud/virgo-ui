import Job from 'stores/job';
import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const FILTERS_KEY = 'system-services:filters';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Host,
			propertyNames: ['services']
		}
	],
	filters: {
		jobs: isSystemServicesJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

function isSystemServicesJob(job) {
	return _.startsWith(job?.name, 'host:system:service');
}

const getSocket = () => {
	return Host.socket;
};

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isSystemServicesJob);
};

const getServices = () => {
	return Host.getServices();
};

const syncServices = () => {
	Host.syncServices();
};

const performServiceAction = (data) => {
	Host.performServiceAction(data);
};

const getFilters = () => {
	let stored = null;
	try {
		stored = JSON.parse(localStorage.getItem(FILTERS_KEY));
	} catch (error) {
		stored = null;
	}
	return {
		type: (_.isString(stored?.type) ? stored.type : ''),
		sub: (_.isArray(stored?.sub) ? stored.sub : []),
		unitFileState: (_.isArray(stored?.unitFileState) ? stored.unitFileState : [])
	};
};

const setFilters = (filters) => {
	try {
		localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
	} catch (error) {
		return;
	}
};

export {
	subscribe,
	getSocket,
	getJobs,
	getServices,
	getFilters,
	setFilters,
	syncServices,
	performServiceAction
};
