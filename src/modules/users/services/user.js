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

const createUser = (config) => {
	User.createUser(config);
};

const updateUser = (config) => {
	User.updateUser(config);
};

const deleteUser = (config) => {
	User.deleteUser(config);
};

const lockUser = (config) => {
	User.lockUser(config);
};

const unlockUser = (config) => {
	User.unlockUser(config);
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
	createUser,
	updateUser,
	deleteUser,
	lockUser,
	unlockUser,
	changePassword
};
