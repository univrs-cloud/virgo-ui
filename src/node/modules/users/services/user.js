import Job from 'stores/job';
import User from 'stores/user';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: Job,
			propertyNames: ['jobs']
		},
		{
			store: User,
			propertyNames: ['users']
		}
	],
	filters: {
		jobs: isUsersJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return {
			users: normalizeUsers(properties?.users),
			jobs: properties?.jobs || []
		};
	}
});

function isUsersJob(job) {
	return _.startsWith(job?.name, 'user');
}

function normalizeUsers(users) {
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

const getJobs = () => {
	return _.filter(Job.getJobs() || [], isUsersJob);
};

const getUsers = () => {
	return normalizeUsers(User.getUsers());
};

const createUser = (data) => {
	User.createUser(data);
};

const updateUser = (data) => {
	User.updateUser(data);
};

const deleteUser = (data) => {
	User.deleteUser(data);
};

const lockUser = (data) => {
	User.lockUser(data);
};

const unlockUser = (data) => {
	User.unlockUser(data);
};

const changePassword = (data) => {
	User.changePassword(data);
};

export {
	subscribe,
	getJobs,
	getUsers,
	createUser,
	updateUser,
	deleteUser,
	lockUser,
	unlockUser,
	changePassword
};
