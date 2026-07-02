import loginPartial from 'shell/partials/login.html';
import * as authService from 'shell/services/auth';

const loginTemplate = _.template(loginPartial);
const main = document.querySelector('main');

main.innerHTML = loginTemplate();

const loginForm = main.querySelector('.fleet-login-form');
const signupForm = main.querySelector('.fleet-signup-form');

const showForm = (form) => {
	loginForm.classList.toggle('d-none', form !== loginForm);
	signupForm.classList.toggle('d-none', form !== signupForm);
};

const toggleSignup = (event) => {
	event.preventDefault();
	showForm(signupForm);
};

const toggleLogin = (event) => {
	event.preventDefault();
	showForm(loginForm);
};

const submitLogin = async () => {
	_.each(loginForm.querySelectorAll('u-button'), (button) => { button.disabled = true; });

	try {
		const data = loginForm.getData();
		await authService.login(data.email, data.password);
		location.reload();
	} catch (error) {
		notifier.add({ title: error.message, type: 'error', duration: 5000, dismissible: true });
		_.each(loginForm.querySelectorAll('u-button'), (button) => { button.disabled = false; });
	}
};

const submitSignup = async () => {
	_.each(signupForm.querySelectorAll('u-button'), (button) => { button.disabled = true; });

	try {
		const data = signupForm.getData();
		await authService.signup({ email: data.email, password: data.password, fullname: data.fullname });
		location.reload();
	} catch (error) {
		notifier.add({ title: error.message, type: 'error', duration: 5000, dismissible: true });
		_.each(signupForm.querySelectorAll('u-button'), (button) => { button.disabled = false; });
	}
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

signupForm.validation = [
	{
		selector: '.fullname',
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
			isEmpty: `Can't be empty`,
			isStrongPassword: {
				message: `At least 8 characters`,
				minLength: 8,
				minLowercase: 0,
				minUppercase: 0,
				minNumbers: 0,
				minSymbols: 0
			}
		}
	},
	{
		selector: '.password-check',
		rules: {
			isEmpty: `Can't be empty`,
			equals: {
				message: `Passwords do not match`,
				comparison: () => { return signupForm.querySelector('.password').value; }
			}
		}
	}
];

loginForm.addEventListener('valid', submitLogin);
signupForm.addEventListener('valid', submitSignup);
main.querySelector('.fleet-toggle-signup').addEventListener('click', toggleSignup);
main.querySelector('.fleet-toggle-login').addEventListener('click', toggleLogin);
