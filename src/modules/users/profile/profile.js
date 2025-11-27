import profileModalPartial from 'modules/users/profile/partials/modals/edit.html';
import * as userService from 'modules/users/services/user';

document.querySelector('body').insertAdjacentHTML('beforeend', profileModalPartial);

const modal = document.querySelector('#profile-edit');
const form = modal.closest('u-form');

const updateProfile = (event) => {
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = form.getData();
	config.username = account.user;
	userService.updateUser(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
};

const render = (event) => {
	const user = _.find(userService.getUsers(), { username: account.user });
	form.querySelector('.title-username').innerHTML = user.username;
	form.querySelector('.fullname').value = user.fullname || user.username;
	form.querySelector('.email').value = user.email;
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
	}
];
form.addEventListener('valid', updateProfile);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
