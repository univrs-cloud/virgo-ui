import Session from 'stores/session';

const login = (data) => {
	return Session.login(data);
};

const logout = () => {
	return Session.logout();
};

export {
	login,
	logout
};
