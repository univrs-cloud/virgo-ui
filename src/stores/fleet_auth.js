import * as request from 'stores/request';

class FleetAuth {
	login(config) {
		return request.post('/auth/login', config);
	}

	signup(config) {
		return request.post('/auth/signup', config);
	}

	confirm(config) {
		return request.post('/auth/verify', config);
	}

	logout() {
		return request.post('/auth/logout');
	}

	changePassword(config) {
		return request.post('/auth/password', config);
	}

	mfaSetup() {
		return request.post('/auth/mfa/setup');
	}

	mfaSetupVerify(config) {
		return request.post('/auth/mfa/setup/verify', config);
	}

	mfaVerify(config) {
		return request.post('/auth/mfa/verify', config);
	}
}

export default new FleetAuth();
