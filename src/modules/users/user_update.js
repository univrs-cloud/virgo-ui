import userModalPartial from 'modules/users/partials/modals/user_update.html';
import * as userService from 'modules/users/services/user';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', userModalPartial);

const modal = document.querySelector('#user-update');
const form = modal.closest('u-form');
let user;

const updateUser = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	let config = form.getData();
	config.username = user.username;
	userService.updateUser(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const render = (event) => {
	const uid = event.relatedTarget.closest('.user').dataset.uid;
	user = _.find(userService.getUsers(), { uid: Number(uid) });
	form.querySelector('.fullname').value = user.fullname;
	form.querySelector('.email').value = user.email;
	form.querySelector('.is-admin').checked = _.includes(user.groups, 'admins');
	if (user.username !== 'voyager') {
		form.querySelector('.is-admin').classList.remove('d-none');
	}
};

const restore = (event) => {
	user = null;
	form.querySelector('.is-admin').classList.add('d-none');
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
			isEmail: `Invalid email address`
		}
	}
];
form.addEventListener('valid', updateUser);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
