import passwordModalPartial from 'modules/users/profile/partials/modals/password.html';
import * as userService from 'modules/users/services/user';
import { isEmpty } from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', passwordModalPartial);

const modal = document.querySelector('#profile-password');
const form = modal.closest('u-form');

const changePassword = (event) => {
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = form.getData();
	config.username = account.user;
	userService.changePassword(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
};

const render = (event) => {
	form.querySelector('.title-username').innerHTML = account.user;
};

form.validation = [
	{
		selector: '.password',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
	{
		selector: '.password-check',
		rules: {
			isEmpty: `Can't be empty`,
			equals: {
				message: `Passwords do not match`,
				comparison: () => { return form.querySelector('.password').value; }
			}
		}
	}
];
form.addEventListener('valid', changePassword);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
