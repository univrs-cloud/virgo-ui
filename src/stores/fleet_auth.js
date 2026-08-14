import * as request from 'stores/request';

class FleetAuth {
	login(data) {
		return request.post('/auth/login', data);
	}

	signup(data) {
		return request.post('/auth/signup', data);
	}

	confirm(data) {
		return request.post('/auth/verify', data);
	}

	logout() {
		return request.post('/auth/logout');
	}

	changePassword(data) {
		return request.post('/auth/password', data);
	}

	mfaSetup() {
		return request.post('/auth/mfa/setup');
	}

	mfaSetupVerify(data) {
		return request.post('/auth/mfa/setup/verify', data);
	}

	mfaVerify(data) {
		return request.post('/auth/mfa/verify', data);
	}
}

export default new FleetAuth();
