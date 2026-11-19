import Job from 'stores/job';
import Docker from 'stores/docker';
import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const DEFAULT_NETWORK_INTERFACE_SPEED_BPS = 1_000_000_000;
const FILTERS_KEY = 'apps:filters';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Docker,
			propertyNames: ['configured', 'containers', 'imageUpdates', 'nextcloudAppUpdates', 'mailserver', 'appsResourceMetrics']
		},
		{
			store: Host,
			propertyNames: ['snapshots', 'snapshotRules']
		}
	],
	filters: {
		jobs: isAppsJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return {
			apps: composeAllApps(properties?.configured, properties?.containers, properties?.appsResourceMetrics, properties?.imageUpdates, properties?.nextcloudAppUpdates, properties?.snapshots),
			jobs: properties?.jobs || [],
			nextcloudAppUpdates: properties?.nextcloudAppUpdates,
			mailserver: sortMailserver(properties?.mailserver)
		};
	}
});

function sortMailserver(mailserver) {
	if (!_.isObject(mailserver)) {
		return mailserver;
	}

	return {
		...mailserver,
		domains: _.orderBy(mailserver.domains, [(domain) => { return _.toLower(domain.name); }], ['asc']),
		accounts: _.orderBy(mailserver.accounts, [(account) => { return _.toLower(account.email); }], ['asc']),
		aliases: _.orderBy(mailserver.aliases, [(alias) => { return _.toLower(alias.address); }], ['asc']),
		bans: _.orderBy(mailserver.bans, ['since', 'ip'], ['desc', 'asc'])
	};
}

function isAppsJob(job) {
	return _.startsWith(job?.name, 'app');
}

function composeApps(configured, containers, appsResourceMetrics, imageUpdates, nextcloudAppUpdates, snapshots) {
	if (_.isNull(configured) || _.isNull(containers)) {
		return null;
	}

	return _.map(
		_.orderBy(
			_.filter(configured, { type: 'app' }),
			[(entity) => { return entity.title.toLowerCase(); }],
			['asc']
		),
		(entity) => {
			entity.projectContainers = _.orderBy(
				_.filter(containers, (container) => {
					return container.labels && container.labels['comDockerComposeProject'] === entity.name;
				}),
					['labels.comDockerComposeService'],
					['asc']
			);
			entity.hasUpdates = _.some(imageUpdates, ({ containerId }) => {
				return _.some(entity.projectContainers, (container) => {
					return container.id === containerId;
				});
			});
			entity.hasNextcloudAppUpdates = (_.toLower(entity.name) === 'nextcloud' && !_.isEmpty(nextcloudAppUpdates));
			entity.projectContainers = _.map(entity.projectContainers, (container) => {
				container.hasUpdates = !_.isEmpty(_.filter(imageUpdates, { containerId: container.id }));
				container.urls = Docker.composeUrlFromLabels([container]);
				return container;
			});
			let activeCount = _.size(_.filter(entity.projectContainers, (container) => { return _.includes(['running', 'restarting'], container.state); }));
			if (activeCount === _.size(entity.projectContainers)) {
				entity.state = 'success'; // All containers are running or restarting
			} else if (activeCount === 0) {
				entity.state = 'danger'; // No containers are running or restarting
			} else {
				entity.state = 'warning'; // Some containers are running/restarting, others are not
			}
			entity.urls = Docker.composeUrlFromLabels(entity.projectContainers);
			entity.resourceMetrics = _.find(appsResourceMetrics, { name: entity.name });
			entity.snapshots = _.filter(_.values(snapshots), (snapshot) => {
				return snapshot.dataset === entity.dataset;
			});
			entity.hasDatasetMounts = _.some(entity.projectContainers, (container) => {
				return _.some(container.mounts, (mount) => {
					return _.startsWith(_.toLower(mount.source), _.toLower(`/${entity.dataset}/`));
				});
			});
			return entity;
		});
}

function composeUnmanaged(configured, containers, appsResourceMetrics, imageUpdates) {
	if (_.isNull(configured) || _.isNull(containers)) {
		return null;
	}

	return _.map(Docker.groupUnmanagedContainers(configured, containers), ({ name, title, isStack, containers: groupContainers }) => {
		const projectContainers = _.map(groupContainers, (container) => {
			container.hasUpdates = _.some(imageUpdates, { containerId: container.id });
			container.urls = Docker.composeUrlFromLabels([container]);
			return container;
		});
		const activeCount = _.size(_.filter(projectContainers, (container) => { return _.includes(['running', 'restarting'], container.state); }));
		let state = 'warning';
		if (activeCount === _.size(projectContainers)) {
			state = 'success';
		} else if (activeCount === 0) {
			state = 'danger';
		}
		return {
			name,
			title,
			icon: null,
			category: 'Unmanaged',
			isUnmanaged: true,
			isStack,
			composeFile: projectContainers[0].labels?.comDockerComposeProjectConfigFiles || null,
			canBeRemoved: true,
			projectContainers,
			hasUpdates: _.some(projectContainers, 'hasUpdates'),
			state,
			urls: Docker.composeUrlFromLabels(projectContainers),
			resourceMetrics: _.find(appsResourceMetrics, { name }),
			snapshots: []
		};
	});
}

function composeAllApps(configured, containers, appsResourceMetrics, imageUpdates, nextcloudAppUpdates, snapshots) {
	const apps = composeApps(configured, containers, appsResourceMetrics, imageUpdates, nextcloudAppUpdates, snapshots);
	if (_.isNull(apps)) {
		return null;
	}

	return _.concat(apps, composeUnmanaged(configured, containers, appsResourceMetrics, imageUpdates));
}

const getSocket = () => {
	return Docker.socket;
};

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isAppsJob);
};

const getApps = () => {
	return composeAllApps(Docker.getConfigured(), Docker.getContainers(), Docker.getAppsResourceMetrics(), Docker.getImageUpdates(), Docker.getNextcloudAppUpdates(), Host.getSnapshots());
};

const getNextcloudAppUpdates = () => {
	return Docker.getNextcloudAppUpdates();
};

const getMailserver = () => {
	return sortMailserver(Docker.getMailserver());
};

const getSnapshotRules = () => {
	return Host.getSnapshotRules();
};

const getDefaultNetworkInterface = () => {
	return _.find(Host.getSystem()?.networkInterfaces, { default: true });
};

const getNodeAddress = () => {
	const virtualIp = Host.getSystem()?.virtualIp?.address;
	if (virtualIp) {
		return virtualIp;
	}

	return _.find(getDefaultNetworkInterface()?.addrInfo, { family: 'inet' })?.local ?? null;
};

const getDefaultNetworkInterfaceSpeed = () => {
	return ((getDefaultNetworkInterface()?.speed || (DEFAULT_NETWORK_INTERFACE_SPEED_BPS / 1_000_000)) * 1_000_000 / 8);
};

const update = (data) => {
	Docker.update(data);
};

const checkNextcloudAppUpdates = () => {
	Docker.checkNextcloudAppUpdates();
};

const updateNextcloudApps = (data) => {
	Docker.updateNextcloudApps(data);
};

const fetchMailserver = () => {
	Docker.fetchMailserver();
};

const manageMailserver = (action, data) => {
	Docker.manageMailserver(action, data);
};

const performAppAction = (data) => {
	Docker.performAppAction(data);
};

const performServiceAction = (data) => {
	Docker.performServiceAction(data);
};

const updateSnapshots = (data) => {
	Docker.updateSnapshots(data);
};

const rollback = (data) => {
	Docker.rollback(data);
};

const getFilters = () => {
	let stored = null;
	try {
		stored = JSON.parse(localStorage.getItem(FILTERS_KEY));
	} catch (error) {
		stored = null;
	}
	return {
		category: _.filter(_.castArray(stored?.category ?? []), _.isString),
		status: (_.isString(stored?.status) ? stored.status : ''),
		updates: (_.isString(stored?.updates) ? stored.updates : ''),
		snapshots: (_.isString(stored?.snapshots) ? stored.snapshots : '')
	};
};

const setFilters = (filters) => {
	try {
		localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
	} catch (error) {
		return;
	}
};

const watchResourceMetrics = (isWatching) => {
	Docker.watchResourceMetrics(isWatching);
};

export {
	subscribe,
	watchResourceMetrics,
	getSocket,
	getJobs,
	getApps,
	getNextcloudAppUpdates,
	getMailserver,
	getSnapshotRules,
	getDefaultNetworkInterface,
	getDefaultNetworkInterfaceSpeed,
	getNodeAddress,
	update,
	checkNextcloudAppUpdates,
	updateNextcloudApps,
	fetchMailserver,
	manageMailserver,
	performAppAction,
	performServiceAction,
	updateSnapshots,
	rollback,
	getFilters,
	setFilters
};
