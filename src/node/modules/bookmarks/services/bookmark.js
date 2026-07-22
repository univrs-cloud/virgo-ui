import Job from 'stores/job';
import Bookmark from 'stores/bookmark';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: Bookmark,
			propertyNames: ['configured']
		}
	],
	filters: {
		jobs: isBookmarksJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return {
			bookmarks: composeBookmark(properties?.configured),
			jobs: properties?.jobs || []
		};
	}
});

function isBookmarksJob(job) {
	return _.startsWith(job?.name, 'bookmark');
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
	return _.filter(Job.getJobs() || [], isBookmarksJob);
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
	getJobs,
	getBookmarks,
	createBookmark,
	updateBookmark,
	deleteBookmark
};
