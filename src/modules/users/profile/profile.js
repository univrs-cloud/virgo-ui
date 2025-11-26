import profileModalPartial from 'modules/users/profile/partials/modals/edit.html';
import * as userService from 'modules/users/services/user';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', profileModalPartial);

const form = document.querySelector('#profile-edit');

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

const updateProfile = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	let config = {
		username: account.user,
		fullname: form.querySelector('.fullname').value,
		email: form.querySelector('.email').value
	};

	userService.updateUser(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
};

const restore = (event) => {
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(form.querySelectorAll('.form-floating'), (field) => {
		field.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		field.querySelector('.invalid-feedback').innerHTML = '';
	});
};

const render = (event) => {
	const users = userService.getUsers();
	const user = _.find(users, { username: account.user });
	form.querySelector('.title-username').innerHTML = user.username;
	form.querySelector('.fullname').value = user.fullname || user.username;
	form.querySelector('.email').value = user.email;
};

form.querySelector('.fullname').addEventListener('input', validateFullname);
form.querySelector('.email').addEventListener('input', validateEmailAddress);
form.addEventListener('submit', updateProfile);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
