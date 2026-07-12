import loginPartial from 'fleet/partials/login.html';
import * as fleetAuthService from 'shell/services/fleet_auth';

const main = document.querySelector('main');
main.innerHTML = loginPartial;

const loginForm = main.querySelector('.login');
const registerForm = main.querySelector('.register');
const checkEmail = main.querySelector('.check-email');

const focusFirstInput = (form) => {
	const input = form.querySelector('u-input');
	input?.updateComplete.then(() => input.focus());
};

const login = async () => {
	const button = loginForm.querySelector('u-button[type="submit"]');
	button.disabled = true;
	try {
		const result = await fleetAuthService.login(loginForm.getData());
		if (result.status === 'succeeded') {
			window.location.reload();
			return;
		}
		notifier.add({ title: result.message || 'Something went wrong.', type: 'error', duration: 0 });
	} catch (error) {
		notifier.add({ title: 'Something went wrong.', type: 'error', duration: 0 });
	}
	button.disabled = false;
};

const register = async () => {
	const button = registerForm.querySelector('u-button[type="submit"]');
	button.disabled = true;
	try {
		const data = registerForm.getData();
		const result = await fleetAuthService.signup(data);
		if (result.status === 'succeeded') {
			// The account is not created yet — swap to the "check your email" state instead of reloading.
			showCheckEmail(result.email || data.email);
		} else {
			notifier.add({ title: result.message || 'Something went wrong.', type: 'error', duration: 0 });
		}
	} catch (error) {
		notifier.add({ title: 'Something went wrong.', type: 'error', duration: 0 });
	}
	// Re-enable so a failed attempt (or a retry from the check-email state) still works; login returns
	// early on success because the page reloads.
	button.disabled = false;
};

const showRegister = (event) => {
	event.preventDefault();
	loginForm.reset();
	loginForm.classList.add('d-none');
	checkEmail.classList.add('d-none');
	registerForm.classList.remove('d-none');
	focusFirstInput(registerForm);
};

const showLogin = (event) => {
	event.preventDefault();
	registerForm.reset();
	registerForm.classList.add('d-none');
	checkEmail.classList.add('d-none');
	loginForm.classList.remove('d-none');
	focusFirstInput(loginForm);
};

const showCheckEmail = (email) => {
	registerForm.reset();
	registerForm.classList.add('d-none');
	loginForm.classList.add('d-none');
	checkEmail.querySelector('.check-email-address').textContent = email || '';
	checkEmail.classList.remove('d-none');
};

loginForm.validation = [
	{
		selector: '.email',
		rules: {
			isEmpty: `Can't be empty`,
			isEmail: 'Invalid email address'
		}
	},
	{
		selector: '.password',
		rules: {
			isEmpty: `Can't be empty`
		}
	}
];

registerForm.validation = [
	{
		selector: '.display-name',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
	{
		selector: '.email',
		rules: {
			isEmpty: `Can't be empty`,
			isEmail: 'Invalid email address'
		}
	},
	{
		selector: '.password',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
	{
		selector: '.password-confirm',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				validate: (value) => value === registerForm.querySelector('.password').value,
				message: 'Passwords do not match'
			}
		}
	}
];

loginForm.addEventListener('valid', login);
registerForm.addEventListener('valid', register);
main.querySelector('.show-register').addEventListener('click', showRegister);
// Both the register form and the check-email panel carry a ".show-login" link.
main.querySelectorAll('.show-login').forEach((link) => link.addEventListener('click', showLogin));

// A failed verification link redirects here with ?verify=failed&reason=... — surface it once,
// then strip the query so a refresh doesn't repeat the toast.
const params = new URLSearchParams(window.location.search);
if (params.get('verify') === 'failed') {
	notifier.add({ title: params.get('reason') || 'Verification failed.', type: 'error', duration: 0 });
	window.history.replaceState({}, '', window.location.pathname);
}

focusFirstInput(loginForm);
