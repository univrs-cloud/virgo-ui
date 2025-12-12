import User from 'stores/user';

let callbackCollection = [];

const filter = (users) => {
	if (_.isNull(users)) {
		return null;
	}
	
	return _.map(users, (user) => {
		user.groups = _.sortBy(_.map(user.groups, (group) => {
			if (typeof group === 'string') {
				return group;
			}

			return group.groupname;
		}));
		return user;
	});
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
	const users = filter(properties.users);
	_.each(callbackCollection, (callback) => {
		callback({ users });
	});
};

const subscribe = (callbacks) => {
	callbackCollection = _.concat(callbackCollection, callbacks);
	return User.subscribeToProperties(['users'], handleSubscription);
};

const unsubscribe = (subsciption) => {
	if (subsciption) {
		subsciption();
	}
};

export {
	subscribe,
	unsubscribe,
	getUsers,
	createUser,
	updateUser,
	deleteUser,
	lockUser,
	unlockUser,
	changePassword
};
