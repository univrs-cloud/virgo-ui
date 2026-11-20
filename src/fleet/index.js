const moduleLoaders = {
	'not-found': () => import('node/modules/not_found'),
	'node-unavailable': () => import('fleet/node_unavailable'),
	'sites': () => import('fleet/sites'),
	'profile': () => import('fleet/profile')
};

const moduleCache = {};

export const loadModule = (name) => {
	if (!moduleCache[name]) {
		const loader = moduleLoaders[name];
		moduleCache[name] = (loader ? loader() : loadModule('not-found'));
	}
	return moduleCache[name];
};

export const modulesLoaded = Promise.allSettled([
	loadModule('not-found'),
	loadModule('sites')
]);
