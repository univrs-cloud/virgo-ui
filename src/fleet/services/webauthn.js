import FleetWebauthn from 'stores/fleet_webauthn';

/**
 * Biometric sign-in (WebAuthn passkeys) for the fleet role.
 *
 * The credential is created as a discoverable key with user verification required, so the
 * authenticator both names the account and proves the person is present — which is why a verified
 * assertion is accepted in place of password + TOTP. Enrollment is only reachable from a
 * fully authenticated session, so that substitution can never be the first thing a device does.
 *
 * The WebAuthn API speaks ArrayBuffers while the endpoints speak base64url JSON, so every ceremony
 * is decoded on the way in and encoded on the way out.
 */

// Set once this device has enrolled. The sign-in screen runs before any session exists, so the
// account cookie can't tell it whether to offer biometrics — this marker is the only signal
// available at that point. It is a hint, never an authorisation: the server re-checks everything.
const DEVICE_KEY = 'virgo.fleet.passkey';

const decode = (value) => {
	const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
	return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const encode = (buffer) => {
	const binary = String.fromCharCode(...new Uint8Array(buffer));
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const ensureSucceeded = (result) => {
	if (result?.status !== 'succeeded') {
		throw new Error(result?.message || 'Something went wrong.');
	}
	return result;
};

// The one gate on this feature: does the device have a built-in authenticator the user can verify
// against — a fingerprint reader, a face camera, or the platform equivalent. Enrollment asks for a
// platform authenticator, so a device without one can't enroll and stays on password + TOTP.
//
// Memoised: it can't change within a page load, and both the sign-in screen and the profile ask.
// The optional call also covers a browser with no WebAuthn at all, which answers the same way.
let biometricsAvailable = null;
const hasBiometrics = () => {
	if (!biometricsAvailable) {
		biometricsAvailable = (async () => {
			try {
				return await window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable() === true;
			} catch (error) {
				return false;
			}
		})();
	}
	return biometricsAvailable;
};

const isEnrolledOnThisDevice = () => {
	try {
		return localStorage.getItem(DEVICE_KEY) === '1';
	} catch (error) {
		return false;
	}
};

const setEnrolledOnThisDevice = (enrolled) => {
	try {
		if (enrolled) {
			localStorage.setItem(DEVICE_KEY, '1');
		} else {
			localStorage.removeItem(DEVICE_KEY);
		}
	} catch (error) {
		// Private browsing can refuse storage; the ceremonies still work, they just aren't offered
		// automatically next launch.
	}
};

const toCreationOptions = (options) => {
	return {
		...options,
		challenge: decode(options.challenge),
		user: { ...options.user, id: decode(options.user.id) },
		excludeCredentials: (options.excludeCredentials || []).map((credential) => {
			return { ...credential, id: decode(credential.id) };
		})
	};
};

const toRequestOptions = (options) => {
	return {
		...options,
		challenge: decode(options.challenge),
		allowCredentials: (options.allowCredentials || []).map((credential) => {
			return { ...credential, id: decode(credential.id) };
		})
	};
};

const serializeRegistration = (credential) => {
	return {
		id: credential.id,
		rawId: encode(credential.rawId),
		type: credential.type,
		clientExtensionResults: credential.getClientExtensionResults(),
		response: {
			clientDataJSON: encode(credential.response.clientDataJSON),
			attestationObject: encode(credential.response.attestationObject),
			transports: credential.response.getTransports?.() || []
		}
	};
};

const serializeAuthentication = (credential) => {
	return {
		id: credential.id,
		rawId: encode(credential.rawId),
		type: credential.type,
		clientExtensionResults: credential.getClientExtensionResults(),
		response: {
			clientDataJSON: encode(credential.response.clientDataJSON),
			authenticatorData: encode(credential.response.authenticatorData),
			signature: encode(credential.response.signature),
			userHandle: credential.response.userHandle ? encode(credential.response.userHandle) : null
		}
	};
};

/**
 * Enroll this device. Requires a fully authenticated session — the server rejects the options call
 * otherwise. Resolves false when the user dismisses the system prompt, which is a cancellation
 * rather than a failure and should not be reported as an error.
 */
const enroll = async () => {
	if (!await hasBiometrics()) {
		throw new Error('This device does not support biometric sign-in.');
	}
	const { options, challengeId } = ensureSucceeded(await FleetWebauthn.registerOptions());
	let credential = null;
	try {
		credential = await navigator.credentials.create({ publicKey: toCreationOptions(options) });
	} catch (error) {
		if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
			return false;
		}
		if (error.name === 'InvalidStateError') {
			// The authenticator matched an excludeCredentials entry: this device is already enrolled
			// on the account, so record that locally and treat it as a success.
			setEnrolledOnThisDevice(true);
			return true;
		}
		throw error;
	}
	ensureSucceeded(await FleetWebauthn.registerVerify({
		challengeId,
		response: serializeRegistration(credential)
	}));
	setEnrolledOnThisDevice(true);
	return true;
};

/**
 * Sign in with this device's biometrics. On success the server has already set a satisfied session
 * cookie, so the caller only needs to navigate. Resolves false when the user dismisses the prompt.
 */
const authenticate = async () => {
	if (!await hasBiometrics()) {
		throw new Error('This device does not support biometric sign-in.');
	}
	const { options, challengeId } = ensureSucceeded(await FleetWebauthn.authenticateOptions());
	let credential = null;
	try {
		credential = await navigator.credentials.get({ publicKey: toRequestOptions(options) });
	} catch (error) {
		if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
			return false;
		}
		throw error;
	}
	try {
		ensureSucceeded(await FleetWebauthn.authenticateVerify({
			challengeId,
			response: serializeAuthentication(credential)
		}));
	} catch (error) {
		// The account may have been revoked from another device since this one enrolled. Drop the
		// marker so the next launch goes straight to the password form instead of prompting again.
		setEnrolledOnThisDevice(false);
		throw error;
	}
	return true;
};

/** Account-wide off: revokes every enrolled device, this one included. */
const disable = async () => {
	ensureSucceeded(await FleetWebauthn.disable());
	setEnrolledOnThisDevice(false);
	return true;
};

export {
	hasBiometrics,
	isEnrolledOnThisDevice,
	setEnrolledOnThisDevice,
	enroll,
	authenticate,
	disable
};
