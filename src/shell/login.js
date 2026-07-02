import loginPartial from 'shell/partials/login.html';
import * as authService from 'shell/services/auth';

const loginTemplate = _.template(loginPartial);
const main = document.querySelector('main');

main.innerHTML = loginTemplate();

const form = main.querySelector('.fleet-login-form');
const errorEl = main.querySelector('.fleet-login-error');

const showError = (message) => {
	errorEl.textContent = message;
	errorEl.classList.remove('d-none');
};

const submitLogin = async () => {
	_.each(form.querySelectorAll('u-button'), (button) => { button.disabled = true; });
	errorEl.classList.add('d-none');

	try {
		const data = form.getData();
		await authService.login(data.email, data.password);
		location.reload();
	} catch (error) {
		showError(error.message);
		_.each(form.querySelectorAll('u-button'), (button) => { button.disabled = false; });
	}
};

form.validation = [
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
form.addEventListener('valid', submitLogin);
