import Job from 'stores/job';
import Shortcut from 'stores/shortcut';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Shortcut,
			propertyNames: ['configured']
		}
	],
	filters: {
		jobs: isShortcutsJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return {
			shortcuts: composeShortcut(properties?.configured),
			jobs: properties?.jobs || []
		};
	}
});

function isShortcutsJob(job) {
	return _.startsWith(job?.name, 'shortcut');
}

function composeShortcut(configured) {
	if (_.isNull(configured)) {
		return null;
	}

	return _.orderBy(
		_.filter(configured, { type: 'shortcut' }),
		[(entity) => { return entity.title.toLowerCase(); }],
		['asc']
	);
}

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isShortcutsJob);
};

const getShortcuts = () => {
	return composeShortcut(Shortcut.getConfigured());
};

const createShortcut = (data) => {
	Shortcut.createShortcut(data);
};

const updateShortcut = (data) => {
	Shortcut.updateShortcut(data);
};

const deleteShortcut = (data) => {
	Shortcut.deleteShortcut(data);
};

export {
	subscribe,
	getJobs,
	getShortcuts,
	createShortcut,
	updateShortcut,
	deleteShortcut
};
