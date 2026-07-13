import FleetAuth from 'stores/fleet_auth';

const login = (config) => {
	return FleetAuth.login(config);
};

const signup = (config) => {
	return FleetAuth.signup(config);
};

const confirm = (config) => {
	return FleetAuth.confirm(config);
};

const logout = () => {
	return FleetAuth.logout();
};

const changePassword = (config) => {
	return FleetAuth.changePassword(config);
};

const mfaSetup = () => {
	return FleetAuth.mfaSetup();
};

const mfaSetupVerify = (config) => {
	return FleetAuth.mfaSetupVerify(config);
};

const mfaVerify = (config) => {
	return FleetAuth.mfaVerify(config);
};

export {
	login,
	signup,
	confirm,
	logout,
	changePassword,
	mfaSetup,
	mfaSetupVerify,
	mfaVerify
};
