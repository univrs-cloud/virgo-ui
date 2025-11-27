import userModalPartial from 'modules/users/partials/modals/user_create.html';
import * as userService from 'modules/users/services/user';

document.querySelector('body').insertAdjacentHTML('beforeend', userModalPartial);

const modal = document.querySelector('#user-create');
const form = modal.closest('u-form');

const createUser = (event) => {
	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = form.getData();
	userService.createUser(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
};

form.validation = [
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
			isEmail: `Invalid email address`
		}
	},
	{
		selector: '.username',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
	{
		selector: '.password',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
	{
		selector: '.password-check',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
];
form.addEventListener('valid', createUser);
form.addEventListener('hidden.bs.modal', restore);

// const validatePasswordCheck = (event) => {
// 	const input = form.querySelector('.password-check');
// 	const value = input.value;
// 	if (!validator.equals(value, form.querySelector('.password').value)) {
// 		input.error = `Passwords do not match`;
// 		return;
// 	}
// 	input.error = ``;
// };