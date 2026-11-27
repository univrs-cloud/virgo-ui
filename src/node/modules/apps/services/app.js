import Job from 'stores/job';
import Docker from 'stores/docker';
import Host from 'stores/host';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';
import { getPortConflictTip } from 'node/modules/apps/services/port_conflicts';

const DEFAULT_NETWORK_INTERFACE_SPEED_BPS = 1_000_000_000;
const FLEET_ZONE = 'univrs.cloud';
const FILTERS_KEY = 'apps:filters';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Docker,
			propertyNames: ['configured', 'containers', 'imageUpdates', 'nextcloud', 'mailserver', 'appsResourceMetrics', 'templates']
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
			apps: composeAllApps(properties?.configured, properties?.containers, properties?.appsResourceMetrics, properties?.imageUpdates, properties?.nextcloud?.appUpdates, properties?.snapshots, properties?.templates),
			jobs: properties?.jobs || [],
			nextcloudAppUpdates: properties?.nextcloud?.appUpdates,
			mailserver: sortMailserver(properties?.mailserver),
			nextcloudAccounts: sortNextcloudAccounts(properties?.nextcloud?.accounts)
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

function sortNextcloudAccounts(nextcloudAccounts) {
	if (!_.isObject(nextcloudAccounts)) {
		return nextcloudAccounts;
	}

	return {
		...nextcloudAccounts,
		users: _.orderBy(nextcloudAccounts.users, [(user) => { return _.toLower(user.displayName); }, (user) => { return _.toLower(user.id); }], ['asc', 'asc']),
		groups: _.orderBy(nextcloudAccounts.groups, [(group) => { return _.toLower(group.displayName); }], ['asc'])
	};
}

function isAppsJob(job) {
	return _.startsWith(job?.name, 'app');
}

function isGated(field) {
	const policy = _.toLower(field.auth?.policy);
	if (_.isEmpty(policy) || policy === 'none') {
		return false;
	}

	if (policy === 'optional') {
		return field.auth.default === true;
	}

	return true;
}

function isEditable(template, entity) {
	const system = Host.getSystem();
	const fqdn = _.toLower(system?.osInfo?.fqdn);
	const domainName = _.replace(fqdn, `${_.toLower(system?.osInfo?.hostname)}.`, '');
	const appDomain = (_.toLower(template?.scope) === 'node' ? fqdn : domainName);
	const domain = _.toLower(entity.env?.DOMAIN ?? appDomain);
	const isCertResolverHidden = (domain === appDomain && _.endsWith(domain, `.${FLEET_ZONE}`));
	return _.some(template?.env, (field) => {
		if (field?.editable !== true || isGated(field)) {
			return false;
		}

		return !(_.toLower(field.name) === 'certresolver' && isCertResolverHidden);
	});
}

function findTemplate(templates, name) {
	const appName = _.toLower(name);
	return _.find(templates, (template) => {
		const templateName = _.toLower(template.name);
		return templateName === appName || (template.multiple === true && _.startsWith(appName, `${templateName}-`));
	});
}

function composeApps(configured, containers, appsResourceMetrics, imageUpdates, nextcloudAppUpdates, snapshots, templates) {
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
			entity.isCustom = _.isObject(entity.custom);
			const template = findTemplate(templates, entity.name);
			entity.isEditable = isEditable(template, entity);
			const requiredPorts = (entity.isCustom
				? _.flatMap(entity.custom.services, 'ports')
				: template?.ports);
			entity.portConflictTip = getPortConflictTip(requiredPorts, containers, configured, entity.name, 'starting this app');
			entity.projectContainers = _.map(entity.projectContainers, (container) => {
				const service = _.find(entity.custom?.services, { name: container.labels?.comDockerComposeService });
				const servicePorts = (entity.isCustom ? service?.ports : requiredPorts);
				container.portConflictTip = getPortConflictTip(servicePorts, containers, configured, entity.name, `starting ${service?.name || 'this service'}`);
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

function composeAllApps(configured, containers, appsResourceMetrics, imageUpdates, nextcloudAppUpdates, snapshots, templates) {
	const apps = composeApps(configured, containers, appsResourceMetrics, imageUpdates, nextcloudAppUpdates, snapshots, templates);
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
	return composeAllApps(Docker.getConfigured(), Docker.getContainers(), Docker.getAppsResourceMetrics(), Docker.getImageUpdates(), Docker.getNextcloud()?.appUpdates, Host.getSnapshots());
};

const getNextcloudAppUpdates = () => {
	return Docker.getNextcloud()?.appUpdates;
};

const getNextcloudAccounts = () => {
	return sortNextcloudAccounts(Docker.getNextcloud()?.accounts);
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

const updateStack = (data) => {
	Docker.updateStack(data);
};

const checkNextcloudAppUpdates = () => {
	Docker.checkNextcloudAppUpdates();
};

const updateNextcloudApps = (data) => {
	Docker.updateNextcloudApps(data);
};

const fetchNextcloudAccounts = () => {
	Docker.fetchNextcloudAccounts();
};

const manageNextcloudAccounts = (action, data) => {
	Docker.manageNextcloudAccounts(action, data);
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
	getNextcloudAccounts,
	getMailserver,
	getSnapshotRules,
	getDefaultNetworkInterface,
	getDefaultNetworkInterfaceSpeed,
	getNodeAddress,
	updateStack,
	checkNextcloudAppUpdates,
	updateNextcloudApps,
	fetchNextcloudAccounts,
	manageNextcloudAccounts,
	fetchMailserver,
	manageMailserver,
	performAppAction,
	performServiceAction,
	updateSnapshots,
	rollback,
	getFilters,
	setFilters
};
