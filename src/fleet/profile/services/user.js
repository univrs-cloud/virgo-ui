import FleetUser from 'stores/fleet_user';
import { createSubscription, storeAttach } from 'libs/services/module_store_subscription';

const { subscribe } = createSubscription({
	stores: [
		{
			store: FleetUser,
			propertyNames: ['sessions']
		}
	],
	attachStore: storeAttach.afterCallbacks,
	mapState: (properties) => {
		return properties;
	}
});

const updateUser = (data) => {
	return FleetUser.updateUser(data);
};

const getSessions = () => {
	return FleetUser.getSessions();
};

const listSessions = () => {
	return FleetUser.listSessions();
};

const revokeSession = (data) => {
	return FleetUser.revokeSession(data);
};

const revokeOtherSessions = () => {
	return FleetUser.revokeOtherSessions();
};

export {
	subscribe,
	updateUser,
	getSessions,
	listSessions,
	revokeSession,
	revokeOtherSessions
};
