import * as request from 'stores/request';

class FleetBiometric {
	registerOptions() {
		return request.post('/auth/biometric/register/options');
	}

	registerVerify(data) {
		return request.post('/auth/biometric/register/verify', data);
	}

	authenticateOptions() {
		return request.post('/auth/biometric/options');
	}

	authenticateVerify(data) {
		return request.post('/auth/biometric/verify', data);
	}

	disable() {
		return request.post('/auth/biometric/disable');
	}
}

export default new FleetBiometric();
