import signinPartial from 'fleet/partials/signin.html';
import * as fleetAuthService from 'libs/services/fleet_auth';
import * as webauthnService from 'fleet/services/webauthn';

const ensureSucceeded = (result) => {
	if (result.status !== 'succeeded') {
		throw new Error(result.message || 'Something went wrong.');
	}
	return result;
};

// The panel is only offered on a device that has enrolled; otherwise the screen is exactly the
// password form it was before. Returns whether a biometric prompt is on screen, so the caller knows
// not to steal focus into the email field — that would pop the keyboard up behind the system
// dialog on mobile.
const mountBiometrics = (main) => {
	const panel = main.querySelector('.biometrics');
	if (!webauthnService.isSupported() || !webauthnService.isEnrolledOnThisDevice()) {
		return false;
	}

	const button = panel.querySelector('.biometrics-action');
	const hint = panel.querySelector('.biometrics-hint');
	panel.classList.remove('d-none');

	// One ceremony at a time: a second navigator.credentials.get() aborts the first, so a stray
	// re-mount or an impatient tap would cancel the prompt the user is already looking at.
	let inFlight = false;
	const run = async () => {
		if (inFlight) {
			return;
		}
		inFlight = true;
		button.disabled = true;
		hint.textContent = 'Waiting for your device…';
		try {
			if (await webauthnService.authenticate()) {
				// Session is already satisfied server-side; a full navigation re-reads the cookie and
				// the router lands on the app without a password or a code.
				window.location.replace('/');
				return;
			}
			hint.textContent = 'Cancelled — try again, or use your password below.';
		} catch (error) {
			hint.textContent = 'Biometric sign-in is unavailable — use your password below.';
			notifier.add({ title: error.message || 'Biometric sign-in failed.', type: 'error', duration: 0 });
		}
		button.disabled = false;
		inFlight = false;
	};

	button.addEventListener('click', run);
	run();
	return true;
};

// Rendered fresh on each visit to /signin (page router calls mount), so listeners bind to new DOM.
export const mount = () => {
	const main = document.querySelector('main');
	main.innerHTML = signinPartial;
	const form = main.querySelector('u-form');

	const login = async () => {
		const button = form.querySelector('u-button[type="submit"]');
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

	if (mountBiometrics(main)) {
		return;
	}

	const input = form.querySelector('u-input');
	input?.updateComplete?.then(() => input.focus());
};
