import loginPartial from 'shell/partials/fleet/login.html';

const main = document.querySelector('main');
main.innerHTML = loginPartial;

const loginForm = main.querySelector('.login');
const registerForm = main.querySelector('.register');
const checkEmail = main.querySelector('.check-email');

const focusFirstInput = (form) => {
	const input = form.querySelector('u-input');
	input?.updateComplete.then(() => input.focus());
};

const submit = async (url, data) => {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	const result = await response.json().catch(() => ({}));
	if (!response.ok || result.status !== 'succeeded') {
		throw new Error(result.message || 'Something went wrong.');
	}
	return result;
};

const login = async () => {
	const button = loginForm.querySelector('u-button[type="submit"]');
	button.disabled = true;
	try {
		await submit('/auth/login', loginForm.getData());
		window.location.reload();
	} catch (error) {
		notifier.add({ title: error.message, type: 'error', duration: 0 });
		button.disabled = false;
	}
};

const register = async () => {
	const button = registerForm.querySelector('u-button[type="submit"]');
	button.disabled = true;
	try {
		const data = registerForm.getData();
		const result = await submit('/auth/signup', data);
		// The account is not created yet — swap to the "check your email" state instead of
		// reloading, and re-enable the button so a failed retry from here still works.
		showCheckEmail(result.email || data.email);
		button.disabled = false;
	} catch (error) {
		notifier.add({ title: error.message, type: 'error', duration: 0 });
		button.disabled = false;
	}
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
