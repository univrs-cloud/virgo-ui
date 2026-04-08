import Job from 'stores/job';
import User from 'stores/user';
import { createSubscription, disposeSubscription as unsubscribe, storeAttach } from 'shell/services/module_store_subscription';

const { subscribe } = createSubscription({
	store: User,
	propertyNames: ['users', 'jobs'],
	filters: {
		jobs: isUserModuleJob,
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return { users: normalizeUsers(properties.users), jobs: properties.jobs };
	},
});

function isUserModuleJob(job) {
	return job?.name && _.startsWith(job.name, 'user');
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
	return _.filter(Job.getJobs() || [], isUserModuleJob);
};

const getUsers = () => {
	return normalizeUsers(User.getUsers());
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

export {
	subscribe,
	unsubscribe,
	getJobs,
	getUsers,
	createUser,
	updateUser,
	deleteUser,
	lockUser,
	unlockUser,
	changePassword
};
