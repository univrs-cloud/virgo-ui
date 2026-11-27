import signinPartial from 'fleet/partials/signin.html';
import * as fleetAuthService from 'libs/services/fleet_auth';
import * as webauthnService from 'fleet/services/webauthn';
import * as biometricService from 'fleet/services/biometric';

const ensureSucceeded = (result) => {
	if (result.status !== 'succeeded') {
		throw new Error(result.message || 'Something went wrong.');
	}
	return result;
};

// The panel is offered on any device that supports passkeys; the password form below is untouched
// either way. Returns whether a prompt was opened unasked, so the caller knows not to steal focus
// into the email field — that would pop the keyboard up behind the system dialog on mobile.
const mountPasskey = async (main) => {
	if (!await webauthnService.supportsPasskeys()) {
		return false;
	}

	const panel = main.querySelector('.passkey');
	const button = panel.querySelector('.passkey-action');
	panel.classList.remove('d-none');

	// One ceremony at a time: a second navigator.credentials.get() aborts the first, so a stray
	// re-mount or an impatient tap would cancel the prompt the user is already looking at.
	let inFlight = false;
	// Cancelled, failed, or never answered all land in the same place — the password and TOTP form
	// below, which stays rendered throughout. Nothing here can strand the user.
	const run = async ({ automatic = false } = {}) => {
		if (inFlight) {
			return;
		}
		inFlight = true;
		button.disabled = true;
		try {
			if (await webauthnService.authenticate()) {
				// Session is already satisfied server-side; a full navigation re-reads the cookie and
				// the router lands on the app without a password or a code.
				window.location.replace('/');
				return;
			}
		} catch (error) {
			if (!automatic) {
				notifier.add({ title: error.message || 'Passkey sign-in failed.', type: 'error', duration: 0 });
			}
		}
		button.disabled = false;
		inFlight = false;
	};

	button.addEventListener('click', () => run());

	// The local marker decides only whether to prompt without being asked. It must not gate the
	// button: it's a best-effort localStorage write that a privacy setting can silently refuse, and
	// a forgotten breadcrumb must never hide a credential the device still holds.
	if (!webauthnService.isEnrolledOnThisDevice()) {
		return false;
	}

	run({ automatic: true });
	return true;
};

const mountBiometric = async (main) => {
	const { available, enrolled } = await biometricService.getStatus();
	if (!available || !enrolled) {
		return false;
	}

	const panel = main.querySelector('.biometric');
	const button = panel.querySelector('.biometric-action');
	panel.classList.remove('d-none');

	let inFlight = false;
	const run = async ({ automatic = false } = {}) => {
		if (inFlight) {
			return;
		}
		inFlight = true;
		button.disabled = true;
		try {
			if (await biometricService.authenticate()) {
				window.location.replace('/');
				return;
			}
		} catch (error) {
			if (!automatic) {
				notifier.add({ title: error.message || 'Biometric sign-in failed.', type: 'error', duration: 0 });
			}
		}
		button.disabled = false;
		inFlight = false;
	};

	button.addEventListener('click', () => run());

	run({ automatic: true });
	return true;
};

// Rendered fresh on each visit to /signin (page router calls mount), so listeners bind to new DOM.
export const mount = async () => {
	const main = document.querySelector('main');
	main.innerHTML = signinPartial;
	const form = main.querySelector('u-form');

	const login = async () => {
		const button = form.querySelector('[type="submit"]');
		button.disabled = true;
		const data = form.getData();
		try {
			ensureSucceeded(await fleetAuthService.login(data));
			// Full navigation so the fresh cookie (with its mfa flag) is re-read and the router routes
			// on to /mfa/setup, /mfa/challenge, or the app.
			window.location.replace('/');
		} catch (error) {
			notifier.add({ title: error.message, type: 'error', duration: 0 });
			button.disabled = false;
		}
	};

	form.validation = [
		{ selector: '.email', rules: { isEmpty: `Can't be empty`, isEmail: 'Invalid email address' } },
		{ selector: '.password', rules: { isEmpty: `Can't be empty` } }
	];
	form.addEventListener('valid', login);

	if (biometricService.isInApp()) {
		if (await mountBiometric(main)) {
			return;
		}
	} else if (await mountPasskey(main)) {
		return;
	}

	const input = form.querySelector('.email');
	input?.updateComplete?.then(() => input.focus());
};
