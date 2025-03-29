import User from 'stores/user';

let callbackCollection = [];

const filter = (users) => {
	if (_.isNull(users)) {
		return null;
	}
	
	return _.orderBy(users, ['fullname'], ['asc']);
}

const getUsers = () => {
	return filter(User.getUsers());
};

const updateProfile = (config) => {
	User.updateProfile(config);
};

const changePassword = (config) => {
	User.changePassword(config);
};

const handleSubscription = (properties) => {
	let users = filter(properties.users);

	_.each(callbackCollection, (callback) => {
		callback({ users });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	
	User.subscribeToProperties(['users'], handleSubscription);
};

export {
	subscribe,
	getUsers,
	updateProfile,
	changePassword
};
