import userModalPartial from 'modules/users/partials/modals/user_update.html';
import * as userService from 'modules/users/services/user';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', userModalPartial);

const modal = document.querySelector('#user-update');
const form = modal.querySelector('u-form');
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
			isEmail: `Invalid email address`,
			custom: {
				validate: (value) => {
					const users = userService.getUsers() || [];
					const normalizedEmail = value?.toString().trim().toLowerCase();
					const uid = user?.uid;
					return !_.some(users, (user) => {
						const isSameUser = (uid !== undefined && user.uid === uid);
						if (isSameUser) {
							return false;
						}
						return user.email && user.email.toString().trim().toLowerCase() === normalizedEmail;
					});
				},
				message: `Must be unique`
			}
		}
	}
];
form.addEventListener('valid', updateUser);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
