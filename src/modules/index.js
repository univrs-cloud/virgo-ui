const importPromises = [];

importPromises.push(import('modules/not_found'));
importPromises.push(import('modules/dashboard'));

if (isAuthenticated) {
	importPromises.push(import('modules/apps'));
	importPromises.push(import('modules/bookmarks'));
	importPromises.push(import('modules/folders'));
	importPromises.push(import('modules/time_machines'));
	importPromises.push(import('modules/users'));
	importPromises.push(import('modules/storage'));
	importPromises.push(import('modules/network'));
	importPromises.push(import('modules/settings'));
	importPromises.push(import('modules/software_update'));
}

export const modulesLoaded = Promise.all(importPromises);
