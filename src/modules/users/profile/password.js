import passwordModalPartial from 'modules/users/profile/partials/modals/password.html';
import * as userService from 'modules/users/services/user';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', passwordModalPartial);

const form = document.querySelector('#profile-password');

const validatePassword = (event) => {
	const input = form.querySelector('.password');
	const value = input.value;
	if (validator.isEmpty(value.toString())) {
		input.error = `Can't be empty`;
		return;
	}
	input.error = ``;
};

const validatePasswordCheck = (event) => {
	const input = form.querySelector('.password-check');
	const value = input.value;
	if (validator.isEmpty(value.toString())) {
		input.error = `Can't be empty`;
		return;
	}
	if (!validator.equals(value, form.querySelector('.password').value)) {
		input.error = `Passwords do not match`;
		return;
	}
	input.error = ``;
};

const validateForm = () => {
	validatePassword();
	validatePasswordCheck();
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(form.querySelectorAll('.is-invalid'));
};

const changePassword = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	
	let config = {
		username: account.user,
		password: form.querySelector('.password').value
	};

	userService.changePassword(config);
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
	form.querySelector('.title-username').innerHTML = account.user;
};

form.querySelector('.password').addEventListener('input', validatePassword);
form.querySelector('.password-check').addEventListener('input', validatePasswordCheck);
form.addEventListener('submit', changePassword);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
