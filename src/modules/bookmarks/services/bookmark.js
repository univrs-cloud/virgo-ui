import Job from 'stores/job';
import Bookmark from 'stores/bookmark';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: Bookmark,
	propertyNames: ['configured', 'jobs'],
	filters: {
		jobs: isBookmarkModuleJob,
	},
	doubleRaf: true,
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return { bookmarks: composeBookmark(properties.configured), jobs: properties.jobs };
	},
});

function isBookmarkModuleJob(job) {
	return job?.name && _.startsWith(job.name, 'bookmark');
}

function composeBookmark(configured) {
	if (_.isNull(configured)) {
		return null;
	}

	return _.orderBy(
		_.filter(configured, { type: 'bookmark' }),
		[(entity) => { return entity.title.toLowerCase(); }],
		['asc']
	);
}

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isBookmarkModuleJob);
};

const getBookmarks = () => {
	return composeBookmark(Bookmark.getConfigured());
};

const createBookmark = (config) => {
	Bookmark.createBookmark(config);
};

const updateBookmark = (config) => {
	Bookmark.updateBookmark(config);
};

const deleteBookmark = (config) => {
	Bookmark.deleteBookmark(config);
};

export {
	subscribe,
	unsubscribe,
	getJobs,
	getBookmarks,
	createBookmark,
	updateBookmark,
	deleteBookmark
};
