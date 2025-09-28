import Bookmark from 'stores/bookmark';

let callbackCollection = [];

const composeBookmark = (configured) => {
	if (_.isNull(configured)) {
		return null;
	}
	
	return _.map(
		_.orderBy(
			_.filter(configured.configuration, { type: 'bookmark' }),
			['title'],
			['asc']
		),
		(entity) => {
			entity.id = entity.name;
			return entity;
		});
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
	let bookmarks = composeBookmark(properties.configured);

	_.each(callbackCollection, (callback) => {
		callback({ bookmarks, jobs: properties.jobs });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	
	Bookmark.subscribeToProperties(['configured', 'jobs'], handleSubscription);
};

export {
	subscribe,
	getBookmarks,
	createBookmark,
	updateBookmark,
	deleteBookmark
};
