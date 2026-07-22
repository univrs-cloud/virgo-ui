import signupPartial from 'fleet/partials/signup.html';
import * as fleetAuthService from 'libs/services/fleet_auth';

const ensureSucceeded = (result) => {
	if (result.status !== 'succeeded') {
		throw new Error(result.message || 'Something went wrong.');
	}
	return result;
};

export const mount = () => {
	const main = document.querySelector('main');
	main.innerHTML = signupPartial;
	const form = main.querySelector('u-form');
	const checkEmail = main.querySelector('.check-email');

	// The account isn't created until the emailed link is clicked, so swap to a "check your email"
	// state rather than navigating anywhere.
	const showCheckEmail = (email) => {
		form.classList.add('d-none');
		checkEmail.querySelector('.check-email-address').textContent = email || '';
		checkEmail.classList.remove('d-none');
	};

	const register = async () => {
		const button = form.querySelector('u-button[type="submit"]');
		button.disabled = true;
		try {
			const data = form.getData();
			const result = ensureSucceeded(await fleetAuthService.signup(data));
			showCheckEmail(result.email || data.email);
		} catch (error) {
			notifier.add({ title: error.message, type: 'error', duration: 0 });
		}
		button.disabled = false;
	};

	form.validation = [
		{ selector: '.name', rules: { isEmpty: `Can't be empty` } },
		{ selector: '.email', rules: { isEmpty: `Can't be empty`, isEmail: 'Invalid email address' } },
		{ selector: '.password', rules: { isEmpty: `Can't be empty` } },
		{
			selector: '.password-confirm',
			rules: {
				isEmpty: `Can't be empty`,
				custom: {
					validate: (value) => value === form.querySelector('.password').value,
					message: `Passwords do not match`
				}
			}
		}
	];
	form.addEventListener('valid', register);

	const input = form.querySelector('u-input');
	input?.updateComplete?.then(() => input.focus());
};
