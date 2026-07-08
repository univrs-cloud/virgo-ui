import loginPartial from 'shell/partials/fleet/login.html';

const main = document.querySelector('main');
main.innerHTML = loginPartial;

const loginForm = main.querySelector('.login');
const registerForm = main.querySelector('.register');

const submit = async (url, data) => {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	const result = await response.json().catch(() => ({}));
	if (!response.ok || !result.ok) {
		throw new Error(result.error || 'Something went wrong');
	}
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
		await submit('/auth/signup', registerForm.getData());
		window.location.reload();
	} catch (error) {
		notifier.add({ title: error.message, type: 'error', duration: 0 });
		button.disabled = false;
	}
};

const showRegister = (event) => {
	event.preventDefault();
	loginForm.reset();
	loginForm.classList.add('d-none');
	registerForm.classList.remove('d-none');
};

const showLogin = (event) => {
	event.preventDefault();
	registerForm.reset();
	registerForm.classList.add('d-none');
	loginForm.classList.remove('d-none');
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
main.querySelector('.show-login').addEventListener('click', showLogin);
