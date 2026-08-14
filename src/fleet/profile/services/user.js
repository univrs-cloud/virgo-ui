import FleetUser from 'stores/fleet_user';

const updateUser = (data) => {
	return FleetUser.updateUser(data);
};

export {
	updateUser
};
