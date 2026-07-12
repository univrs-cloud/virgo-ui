import FleetAuth from 'stores/fleet_auth';

const login = (config) => {
	return FleetAuth.login(config);
};

const signup = (config) => {
	return FleetAuth.signup(config);
};

const logout = () => {
	return FleetAuth.logout();
};

const changePassword = (config) => {
	return FleetAuth.changePassword(config);
};

export {
	login,
	signup,
	logout,
	changePassword
};
