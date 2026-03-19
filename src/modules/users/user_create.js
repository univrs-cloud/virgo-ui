import userModalPartial from 'modules/users/partials/modals/user_create.html';
import * as userService from 'modules/users/services/user';

document.querySelector('body').insertAdjacentHTML('beforeend', userModalPartial);

const modal = document.querySelector('#user-create');
const form = modal.querySelector('u-form');

const createUser = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	let config = form.getData();
	userService.createUser(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
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
			isEmail: `Invalid email address`,
			custom: {
				validate: (value) => {
					const users = userService.getUsers() || [];
					const normalizedEmail = value?.toString().trim().toLowerCase();
					return !_.some(users, (user) => {
						return user.email && user.email.toString().trim().toLowerCase() === normalizedEmail;
					});
				},
				message: `Must be unique`
			}
		}
	},
	{
		selector: '.username',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				validate: (value) => {
					const users = userService.getUsers() || [];
					const normalizedUsername = value?.toString().trim().toLowerCase();
					return !_.some(users, (user) => {
						return user.username && user.username.toString().trim().toLowerCase() === normalizedUsername;
					});
				},
				message: `Must be unique`
			}
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
				comparison: () => { return form.querySelector('.password').value; }
			}
		}
	}
];
form.addEventListener('valid', createUser);
modal.addEventListener('hidden.bs.modal', restore);
