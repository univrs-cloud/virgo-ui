import Job from 'stores/job';
import Host from 'stores/host';
import Share from 'stores/share';
import User from 'stores/user';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const DEFAULT_NETWORK_INTERFACE_SPEED_BPS = 1_000_000_000;

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Host,
			propertyNames: ['system']
		},
		{
			store: Share,
			propertyNames: ['shares', 'clients']
		},
		{
			store: User,
			propertyNames: ['users']
		}
	],
	filters: {
		jobs: isTimeMachinesJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		const timeMachines = composeTimeMachines(properties?.shares, properties?.clients);
		const networkInterface = _.find(properties?.system?.networkInterfaces, { default: true });
		return {
			timeMachines,
			networkInterface,
			jobs: properties?.jobs || []
		};
	}
});

function isTimeMachinesJob(job) {
	return _.startsWith(job?.name, 'share');
}

function composeTimeMachines(shares, clients) {
	const timeMachines = filterTimeMachines(shares);
	if (_.isNull(timeMachines)) {
		return null;
	}

	return _.map(timeMachines, (timeMachine) => {
		const timeMachineClients = getTimeMachineClients(timeMachine, clients);
		return {
			...timeMachine,
			clients: timeMachineClients,
			network: { rx: _.sumBy(timeMachineClients, 'rx'), tx: _.sumBy(timeMachineClients, 'tx') }
		};
	});
}

function getTimeMachineClients(timeMachine, clients) {
	const name = _.toLower(timeMachine.name);
	const sessions = _.map((_.isArray(clients) ? clients : []), (session) => {
		return { ...session, shares: _.uniq(_.map(session.shares, _.toLower)) };
	});
	return _.sortBy(_.map(_.groupBy(_.filter(sessions, (session) => { return _.includes(session.shares, name); }), 'address'), (group, address) => {
		return {
			address,
			usernames: _.sortBy(_.uniq(_.map(group, 'username')), _.toLower),
			rx: _.sumBy(group, (session) => { return (session.rx || 0) / _.size(session.shares); }),
			tx: _.sumBy(group, (session) => { return (session.tx || 0) / _.size(session.shares); })
		};
	}), 'address');
}

function filterTimeMachines(shares) {
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
	return _.filter(Job.getJobs() || [], isTimeMachinesJob);
};

const getSystem = () => {
	return Host.getSystem();
};

const getTimeMachines = () => {
	return composeTimeMachines(Share.getShares(), Share.getClients());
};

const getDefaultNetworkInterface = () => {
	return _.find(Host.getSystem()?.networkInterfaces, { default: true });
};

const getDefaultNetworkInterfaceSpeed = () => {
	return ((getDefaultNetworkInterface()?.speed || (DEFAULT_NETWORK_INTERFACE_SPEED_BPS / 1_000_000)) * 1_000_000 / 8);
};

const createTimeMachine = (data) => {
	data.type = 'timeMachine';
	Share.createShare(data);
};

const updateTimeMachine = (data) => {
	data.type = 'timeMachine';
	Share.updateShare(data);
};

const deleteTimeMachine = (data) => {
	data.type = 'timeMachine';
	Share.deleteShare(data);
};

export {
	subscribe,
	getJobs,
	getSystem,
	getTimeMachines,
	getDefaultNetworkInterface,
	getDefaultNetworkInterfaceSpeed,
	createTimeMachine,
	updateTimeMachine,
	deleteTimeMachine
};
