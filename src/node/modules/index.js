const moduleLoaders = {
	'not-found': () => import('node/modules/not_found'),
	'dashboard': () => import('node/modules/dashboard'),
	...(isAdmin && {
		'apps': () => import('node/modules/apps'),
		'bookmarks': () => import('node/modules/bookmarks'),
		'folders': () => import('node/modules/folders'),
		'time-machines': () => import('node/modules/time_machines'),
		'users': () => import('node/modules/users'),
		'storage': () => import('node/modules/storage'),
		'network': () => import('node/modules/network'),
		'settings': () => import('node/modules/settings'),
		'system-services': () => import('node/modules/system_services'),
		'system-updates': () => import('node/modules/system_updates'),
		'about': () => import('node/modules/about')
	}),
	...(isAuthenticated && {
		'profile': () => import('node/modules/users/profile')
	})
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
	loadModule('dashboard')
]);
