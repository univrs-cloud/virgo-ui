import FleetAuth from 'stores/fleet_auth';

const login = (data) => {
	return FleetAuth.login(data);
};

const signup = (data) => {
	return FleetAuth.signup(data);
};

const confirm = (data) => {
	return FleetAuth.confirm(data);
};

const logout = () => {
	return FleetAuth.logout();
};

const changePassword = (data) => {
	return FleetAuth.changePassword(data);
};

const mfaSetup = () => {
	return FleetAuth.mfaSetup();
};

const mfaSetupVerify = (data) => {
	return FleetAuth.mfaSetupVerify(data);
};

const mfaVerify = (data) => {
	return FleetAuth.mfaVerify(data);
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
