import Bookmark from 'stores/bookmark';

let callbackCollection = [];

const composeBookmark = (configured) => {
	if (_.isNull(configured)) {
		return null;
	}
	
	return _.orderBy(
		_.filter(configured, { type: 'bookmark' }),
		[(entity) => { return entity.title.toLowerCase(); }],
		['asc']
	);
}

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

const handleSubscription = (properties) => {
	const bookmarks = composeBookmark(properties.configured);
	_.each(callbackCollection, (callback) => {
		callback({ bookmarks, jobs: properties.jobs });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	
	return Bookmark.subscribeToProperties(['configured', 'jobs'], handleSubscription);
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe,
	getBookmarks,
	createBookmark,
	updateBookmark,
	deleteBookmark
};
