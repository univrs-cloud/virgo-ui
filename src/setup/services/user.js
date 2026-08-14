import User from 'stores/user';
import Job from 'stores/job';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

// The image ships one account, uid 1000, and setup is where its password stops being the default one.
const DEFAULT_UID = 1000;
const PASSWORD_JOB = 'user:changePassword';

function isPasswordJob(job) {
	return job?.name === PASSWORD_JOB;
}

const { subscribe } = createSubscription({
	stores: [
		{
			store: User,
			propertyNames: ['users']
		},
		{
			store: Job,
			propertyNames: ['jobs']
		}
	],
	filters: {
		jobs: isPasswordJob
	},
	attachStore: storeAttach.beforeCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

/** The account the image ships with, the one setup takes off its default password. */
const findDefaultUser = (users) => {
	return _.find(users, { uid: DEFAULT_UID });
};

const getUsers = () => {
	return User.getUsers();
};

const getDefaultUser = () => {
	return findDefaultUser(getUsers());
};

const changePassword = (data) => {
	User.changePassword(data);
};

export {
	PASSWORD_JOB,
	subscribe,
	findDefaultUser,
	getDefaultUser,
	changePassword
};
