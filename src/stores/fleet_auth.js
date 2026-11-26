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

	authenticatorChange(data) {
		return request.post('/auth/mfa/authenticator', data);
	}

	authenticatorChangeVerify(data) {
		return request.post('/auth/mfa/authenticator/verify', data);
	}

	regenerateRecoveryCodes(data) {
		return request.post('/auth/mfa/recovery-codes', data);
	}
}

export default new FleetAuth();
