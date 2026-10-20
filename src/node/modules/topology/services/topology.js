import Host from 'stores/host';
import Docker from 'stores/docker';
import Share from 'stores/share';
import Configuration from 'stores/configuration';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const LOOPBACK_ADDRESS = /^(127\.|::1$)/;
const PROXY_STACK = 'traefik';
const AUTH_STACK = 'authelia';
const TRAFFIC_KEY = 'topology:traffic';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['system', 'discovery', 'peers']
		},
		{
			store: Docker,
			propertyNames: ['configured', 'containers']
		},
		{
			store: Share,
			propertyNames: ['shares', 'clients']
		},
		{
			store: Configuration,
			propertyNames: ['configuration']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return {
			system: properties?.system,
			configuration: properties?.configuration,
			topology: composeTopology(properties?.configured, properties?.containers, properties?.shares, properties?.peers, properties?.discovery, properties?.clients, properties?.system)
		};
	}
});

const { subscribe: subscribeToTraffic } = createSubscription({
	stores: [
		{
			store: Host,
			propertyNames: ['networkStats']
		},
		{
			store: Docker,
			propertyNames: ['appsResourceMetrics']
		},
		{
			store: Share,
			propertyNames: ['clients']
		}
	],
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return composeTraffic(properties?.networkStats, properties?.appsResourceMetrics, properties?.clients);
	}
});

function composeTraffic(networkStats, appsResourceMetrics, clients) {
	const traffic = {};
	if (_.isObject(networkStats)) {
		traffic.node = { rx: networkStats.rx_sec || 0, tx: networkStats.tx_sec || 0 };
	}
	_.each(appsResourceMetrics, (metrics) => {
		traffic[`app:${metrics.name}`] = { rx: metrics.network?.rx || 0, tx: metrics.network?.tx || 0 };
	});
	const add = (key, rx, tx) => {
		const current = traffic[key] || { rx: 0, tx: 0 };
		traffic[key] = { rx: current.rx + rx, tx: current.tx + tx };
	};
	_.each((_.isArray(clients) ? clients : []), (session) => {
		const shares = _.uniq(_.map(session.shares, _.toLower));
		const rx = session.rx || 0;
		const tx = session.tx || 0;
		add(`smb:${session.address}`, rx, tx);
		if (_.isEmpty(shares)) {
			add(`smbroute:${session.address}:`, rx, tx);
		}
		_.each(shares, (share) => {
			add(`smbshare:${share}`, rx / _.size(shares), tx / _.size(shares));
			add(`smbroute:${session.address}:${share}`, rx / _.size(shares), tx / _.size(shares));
		});
	});
	return traffic;
}

function getRoutes(containers) {
	const routes = _.flatMap(containers, (container) => {
		return _.compact(_.map(container.labels, (value, key) => {
			if (!_.startsWith(key, 'traefikHttpRouters') || !_.endsWith(key, 'Rule') || !_.isString(value)) {
				return null;
			}

			const host = _.get(value.match(/Host\(`([^`]+)`\)/), 1);
			if (!host) {
				return null;
			}

			const router = key.slice(0, -'Rule'.length);
			return {
				host: _.toLower(host),
				path: _.get(value.match(/PathPrefix\(`([^`]+)`\)/), 1) || '',
				isAuthRequired: _.includes(_.toLower(container.labels[`${router}Middlewares`]), 'authelia@')
			};
		}));
	});
	return _.orderBy(
		_.map(_.groupBy(routes, (route) => { return `${route.host}${route.path}`; }), (group) => {
			return { ..._.head(group), isAuthRequired: _.some(group, 'isAuthRequired') };
		}),
		['host', 'path'],
		['asc', 'asc']
	);
}

function getPorts(containers) {
	const ports = _.flatMap(containers, (container) => {
		return _.filter(container.ports, (port) => { return port.publicPort && !LOOPBACK_ADDRESS.test(port.ip || ''); });
	});
	return _.orderBy(
		_.map(_.groupBy(ports, 'publicPort'), (group, port) => {
			return { port: _.toNumber(port), protocols: _.sortBy(_.uniq(_.map(group, (entry) => { return _.toLower(entry.type); }))) };
		}),
		['port'],
		['asc']
	);
}

function isHostNetwork(container) {
	return _.toLower(container.hostConfig?.networkMode) === 'host';
}

function composeStacks(configured, containers) {
	const apps = _.filter(configured, { type: 'app' });
	const stacks = _.map(
		_.groupBy(containers, (container) => { return container.labels?.comDockerComposeProject || container.id; }),
		(stackContainers) => {
			const project = stackContainers[0].labels?.comDockerComposeProject || null;
			const app = (project ? _.find(apps, (entity) => { return _.toLower(entity.name) === _.toLower(project); }) : null);
			return {
				name: project || stackContainers[0].id,
				title: app?.title || project || _.trimStart(_.first(stackContainers[0].names), '/'),
				icon: app?.icon || null,
				isUnmanaged: !app,
				routes: getRoutes(stackContainers),
				ports: getPorts(stackContainers),
				isHostNetwork: _.some(stackContainers, isHostNetwork),
				containers: _.map(stackContainers, (container) => {
					return { state: container.state };
				})
			};
		}
	);
	return _.orderBy(stacks, [(stack) => { return _.toLower(stack.title); }], ['asc']);
}

function getHost(url) {
	try {
		return _.toLower(new URL(url).host);
	} catch {
		return null;
	}
}

function composeProxied(configured) {
	const shortcuts = _.filter(configured, (entry) => { return entry.type === 'shortcut' && Boolean(entry.traefik?.subdomain); });
	return _.orderBy(
		_.map(shortcuts, (shortcut) => {
			return {
				name: shortcut.name,
				title: shortcut.title || shortcut.name,
				icon: shortcut.icon || null,
				host: getHost(shortcut.url),
				target: getHost(shortcut.traefik.backendUrl),
				isAuthRequired: Boolean(shortcut.traefik.isAuthRequired)
			};
		}),
		[(shortcut) => { return _.toLower(shortcut.title); }],
		['asc']
	);
}

function composeShares(shares, isTimeMachine) {
	return _.orderBy(
		_.map(_.filter(shares, { isTimeMachine }), (share) => {
			return {
				name: share.name,
				title: share.comment || share.name,
				isPrivate: Boolean(share.isPrivate),
				validUsers: share.validUsers || []
			};
		}),
		[(share) => { return _.toLower(share.title); }],
		['asc']
	);
}

function composeNodes(peers, discovery) {
	const discovered = (_.isArray(discovery) ? discovery : []);
	const adopted = _.map((_.isArray(peers) ? peers : []), (peer) => {
		const seen = _.find(discovered, { id: peer?.id });
		return {
			id: peer?.id,
			name: peer?.name || null,
			address: seen?.address || peer?.address || null,
			virtualIp: (seen?.holdsVirtualIp ? seen.virtualIp : null),
			isAdopted: true,
			isOnline: Boolean(seen)
		};
	});
	const available = _.map(_.reject(discovered, (node) => { return _.some(adopted, { id: node?.id }); }), (node) => {
		return {
			id: node?.id,
			name: node?.name || null,
			address: node?.address || null,
			virtualIp: (node?.holdsVirtualIp ? node.virtualIp : null),
			isAdopted: false,
			isOnline: true
		};
	});
	return _.concat(adopted, available);
}

function addressNumber(address) {
	const parts = _.map(_.split(address, '.'), Number);
	if (_.size(parts) !== 4 || _.some(parts, (part) => { return !_.isInteger(part) || part < 0 || part > 255; })) {
		return null;
	}

	return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]);
}

function isInSubnet(address, network) {
	const value = addressNumber(address);
	const base = addressNumber(network?.local);
	if (_.isNull(value) || _.isNull(base) || !_.isInteger(network?.prefixlen)) {
		return false;
	}

	const mask = (network.prefixlen === 0 ? 0 : ((~0 << (32 - network.prefixlen)) >>> 0));
	return ((value & mask) >>> 0) === ((base & mask) >>> 0);
}

function groupClients(clients) {
	return _.map(_.groupBy((_.isArray(clients) ? clients : []), 'address'), (sessions, address) => {
		return {
			address,
			usernames: _.sortBy(_.uniq(_.map(sessions, 'username')), _.toLower),
			shares: _.sortBy(_.uniq(_.map(_.flatMap(sessions, 'shares'), _.toLower)))
		};
	});
}

function composeClients(clients, system) {
	const networkInterface = _.find(system?.networkInterfaces, { default: true });
	const network = _.find(networkInterface?.addrInfo, { family: 'inet' });
	return _.orderBy(
		_.map(groupClients(clients), (client) => {
			return {
				address: client.address,
				usernames: client.usernames,
				shares: client.shares,
				isLocal: isInSubnet(client.address, network)
			};
		}),
		[(client) => { return _.toLower(_.head(client.usernames)); }, 'address'],
		['asc', 'asc']
	);
}

function composeTopology(configured, containers, shares, peers, discovery, clients, system) {
	if (!_.isArray(configured) || !_.isArray(containers)) {
		return null;
	}

	const stacks = composeStacks(configured, containers);
	const proxy = _.find(stacks, (stack) => { return _.toLower(stack.name) === PROXY_STACK; }) || null;
	const auth = (proxy ? _.find(stacks, (stack) => { return _.toLower(stack.name) === AUTH_STACK; }) || null : null);
	const others = _.without(stacks, proxy, auth);
	const routed = (proxy ? _.filter(others, (stack) => { return !_.isEmpty(stack.routes); }) : []);
	const unrouted = _.difference(others, routed);
	const proxied = (proxy ? composeProxied(configured) : []);
	return {
		proxy,
		auth,
		routed,
		proxied,
		published: _.filter(unrouted, (stack) => { return !_.isEmpty(stack.ports) || stack.isHostNetwork; }),
		internal: _.filter(unrouted, (stack) => { return _.isEmpty(stack.ports) && !stack.isHostNetwork; }),
		folders: composeShares(shares, false),
		timeMachines: composeShares(shares, true),
		nodes: composeNodes(peers, discovery),
		clients: composeClients(clients, system)
	};
}

const isTrafficShown = () => {
	try {
		return (localStorage.getItem(TRAFFIC_KEY) === 'shown');
	} catch (error) {
		return false;
	}
};

const setTrafficShown = (isShown) => {
	try {
		localStorage.setItem(TRAFFIC_KEY, (isShown ? 'shown' : 'hidden'));
	} catch (error) {
		return;
	}
};

export {
	subscribe,
	subscribeToTraffic,
	isTrafficShown,
	setTrafficShown
};
