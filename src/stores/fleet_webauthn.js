import * as request from 'stores/request';

/**
 * Network layer for WebAuthn (biometric / passkey) sign-in against the fleet controller's
 * `/auth/webauthn/*` HTTP endpoints. A plain fetch client like `stores/fleet_auth`.
 *
 * Every ceremony is two calls: an `*Options` request that returns a server-issued challenge plus
 * the handle identifying it, then a `*Verify` request carrying the authenticator's answer and that
 * same handle. The browser-side `navigator.credentials` work lives in the service above this.
 */
class FleetWebauthn {
	registerOptions() {
		return request.post('/auth/webauthn/register/options');
	}

	registerVerify(data) {
		return request.post('/auth/webauthn/register/verify', data);
	}

	authenticateOptions() {
		return request.post('/auth/webauthn/options');
	}

	authenticateVerify(data) {
		return request.post('/auth/webauthn/verify', data);
	}

	// Account-wide: revokes every enrolled device, not just this one.
	disable() {
		return request.post('/auth/webauthn/disable');
	}
}

export default new FleetWebauthn();
