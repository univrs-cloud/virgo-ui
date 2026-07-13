import signinPartial from 'fleet/partials/signin.html';
import * as fleetAuthService from 'shell/services/fleet_auth';

const ensureSucceeded = (result) => {
	if (result.status !== 'succeeded') {
		throw new Error(result.message || 'Something went wrong.');
	}
	return result;
};

// Rendered fresh on each visit to /signin (page router calls mount), so listeners bind to new DOM.
export const mount = () => {
	const main = document.querySelector('main');
	main.innerHTML = signinPartial;
	const form = main.querySelector('u-form.login');

	const login = async () => {
		const button = form.querySelector('u-button[type="submit"]');
		button.disabled = true;
		try {
			ensureSucceeded(await fleetAuthService.login(form.getData()));
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

	const input = form.querySelector('u-input');
	input?.updateComplete?.then(() => input.focus());
};
