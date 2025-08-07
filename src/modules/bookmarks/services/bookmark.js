import Docker from 'stores/docker';

let callbackCollection = [];

const composeUrlFromProxy = (proxy) => {
	return `${proxy.sslForced ? 'https://' : 'http://'}${_.first(proxy.domainNames)}`;
};

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
	return composeBookmark(Docker.getConfigured());
};

const createBookmark = (config) => {
	Docker.createBookmark(config);
};

const updateBookmark = (config) => {
	Docker.updateBookmark(config);
};

const deleteBookmark = (config) => {
	Docker.deleteBookmark(config);
};

const performAction = (config) => {
	
};

const handleSubscription = (properties) => {
	let bookmarks = composeBookmark(properties.configured);

	_.each(callbackCollection, (callback) => {
		callback({ bookmarks, jobs: properties.jobs });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	
	Docker.subscribeToProperties(['configured', 'jobs'], handleSubscription);
};

export {
	subscribe,
	getBookmarks,
	createBookmark,
	updateBookmark,
	deleteBookmark,
	performAction
};
