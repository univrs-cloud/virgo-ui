import passwordModalPartial from 'modules/users/partials/modals/user_password.html';
import * as userService from 'modules/users/services/user';

document.querySelector('body').insertAdjacentHTML('beforeend', passwordModalPartial);

const modal = document.querySelector('#user-password');
const form = modal.closest('u-form');
let user;

const changePassword = (event) => {
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = form.getData();
	config.username = user.username;
	userService.changePassword(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	user = null;
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
};

const render = (event) => {
	const uid = event.relatedTarget.closest('.user').dataset.uid;
	user = _.find(userService.getUsers(), { uid: Number(uid) });
	form.querySelector('.title-username').innerHTML = user.username;
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
