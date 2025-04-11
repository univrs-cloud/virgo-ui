import passwordModalPartial from 'modules/users/profile/partials/modals/password.html';
import * as userService from 'modules/users/services/user';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', passwordModalPartial);

let passwordForm = document.querySelector('#profile-password');

const validatePassword = (event) => {
	let input = passwordForm.querySelector('.password');
	let invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	let value = input.value;
	if (validator.isEmpty(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	input.classList.remove('is-invalid');
	input.classList.add('is-valid');
};

const validatePasswordCheck = (event) => {
	let input = passwordForm.querySelector('.password-check');
	let invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	let value = input.value;
	if (validator.isEmpty(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	if (!validator.equals(value, passwordForm.querySelector('.password').value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Passwords do not match`;
		return;
	}
	input.classList.remove('is-invalid');
	input.classList.add('is-valid');
};

const validateForm = () => {
	validatePassword();
	validatePasswordCheck();
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(passwordForm.querySelectorAll('.is-invalid'));
};

const changePassword = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	let form = event.target;
	let buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = {
		username: account.user,
		password: form.querySelector('.password').value
	};

	userService.changePassword(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
};

const restore = (event) => {
	passwordForm.reset();
	_.each(passwordForm.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(passwordForm.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		input.querySelector('.invalid-feedback').innerHTML = '';
	});
};

const render = (event) => {
	passwordForm.querySelector('.title-username').innerHTML = account.user;
};

passwordForm.querySelector('.password').addEventListener('input', validatePassword);
passwordForm.querySelector('.password-check').addEventListener('input', validatePasswordCheck);
passwordForm.addEventListener('submit', changePassword);
passwordForm.addEventListener('show.bs.modal', render);
passwordForm.addEventListener('hidden.bs.modal', restore);
