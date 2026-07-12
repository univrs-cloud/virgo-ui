import FleetUser from 'stores/fleet_user';

const updateUser = (config) => {
	return FleetUser.updateUser(config);
};

export {
	updateUser
};
