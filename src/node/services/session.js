import Session from 'stores/session';
import User from 'stores/user';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: User,
			propertyNames: ['role']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const login = (data) => {
	return Session.login(data);
};

const logout = () => {
	return Session.logout();
};

export {
	subscribe,
	login,
	logout
};
