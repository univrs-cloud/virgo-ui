const moduleLoaders = {
	'not-found': () => import('modules/not_found'),
	'dashboard': () => import('modules/dashboard'),
	...(isAuthenticated && isAdmin && {
		'apps': () => import('modules/apps'),
		'bookmarks': () => import('modules/bookmarks'),
		'folders': () => import('modules/folders'),
		'time-machines': () => import('modules/time_machines'),
		'users': () => import('modules/users'),
		'storage': () => import('modules/storage'),
		'network': () => import('modules/network'),
		'settings': () => import('modules/settings'),
		'system-services': () => import('modules/system_services'),
		'system-updates': () => import('modules/system_updates'),
		'about': () => import('modules/about'),
	}),
	...(isAuthenticated && {
		'profile': () => import('modules/users/profile'),
	}),
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
