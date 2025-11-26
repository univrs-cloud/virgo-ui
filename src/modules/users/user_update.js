import userModalPartial from 'modules/users/partials/modals/user_update.html';
import * as userService from 'modules/users/services/user';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', userModalPartial);

const form = document.querySelector('#user-update');
let user;

const validateFullname = (event) => {
	const input = form.querySelector('.fullname');
	const value = input.value;
	if (validator.isEmpty(value.toString())) {
		input.error = `Can't be empty`;
		return;
	}
	input.error = ``;
};

const validateEmailAddress = (event) => {
	const input = form.querySelector('.email');
	const value = input.value;
	if (validator.isEmpty(value.toString())) {
		input.error = `Can't be empty`;
		return;
	}
	if (!validator.isEmail(value)) {
		input.error = `Invalid email address`;
		return;
	}
	input.error = ``;
};

const validateForm = () => {
	validateFullname();
	validateEmailAddress();
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(form.querySelectorAll('.is-invalid'));
};

const updateUser = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	let config = {
		username: user.username,
		fullname: form.querySelector('.fullname').value,
		email: form.querySelector('.email').value
	};

	userService.updateUser(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
};

const render = (event) => {
	const uid = event.relatedTarget.closest('.user').dataset.uid;
	const users = userService.getUsers();
	user = _.find(users, { uid: Number(uid) });
	form.querySelector('.fullname').value = user.fullname;
	form.querySelector('.email').value = user.email;
};

const restore = (event) => {
	user = null;
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(form.querySelectorAll('.form-floating'), (field) => {
		field.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		field.querySelector('.invalid-feedback').innerHTML = '';
	});
};

form.querySelector('.fullname').addEventListener('input', validateFullname);
form.querySelector('.email').addEventListener('input', validateEmailAddress);
form.addEventListener('submit', updateUser);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
