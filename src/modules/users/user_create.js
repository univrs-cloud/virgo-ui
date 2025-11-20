import userModalPartial from 'modules/users/partials/modals/user_create.html';
import * as userService from 'modules/users/services/user';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', userModalPartial);

const form = document.querySelector('#user-create');

const validateFullname = (event) => {
	const input = form.querySelector('.fullname');
	const invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	const value = input.value;
	if (validator.isEmpty(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	input.classList.remove('is-invalid');
	input.classList.add('is-valid');
};

const validateEmailAddress = (event) => {
	const input = form.querySelector('.email');
	const invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	const value = input.value;
	if (validator.isEmpty(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	if (!validator.isEmail(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Invalid email address`;
		return;
	}
	input.classList.remove('is-invalid');
	input.classList.add('is-valid');
};

const validateUsername = (event) => {
	const input = form.querySelector('.username');
	const invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	const value = input.value;
	if (validator.isEmpty(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	input.classList.remove('is-invalid');
	input.classList.add('is-valid');
};

const validatePassword = (event) => {
	const input = form.querySelector('.password');
	const invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	const value = input.value;
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
	const input = form.querySelector('.password-check');
	const invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	const value = input.value;
	if (validator.isEmpty(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	if (!validator.equals(value, form.querySelector('.password').value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Passwords do not match`;
		return;
	}
	input.classList.remove('is-invalid');
	input.classList.add('is-valid');
};

const validateForm = () => {
	validateFullname();
	validateEmailAddress();
	validateUsername();
	validatePassword();
	validatePasswordCheck();
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(form.querySelectorAll('.is-invalid'));
};

const createUser = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	let config = {
		username: form.querySelector('.username').value,
		password: form.querySelector('.password').value,
		fullname: form.querySelector('.fullname').value,
		email: form.querySelector('.email').value
	};

	userService.createUser(config);
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

form.querySelector('.fullname').addEventListener('input', validateFullname);
form.querySelector('.email').addEventListener('input', validateEmailAddress);
form.querySelector('.username').addEventListener('input', validateUsername);
form.querySelector('.password').addEventListener('input', validatePassword);
form.querySelector('.password-check').addEventListener('input', validatePasswordCheck);
form.addEventListener('submit', createUser);
form.addEventListener('hidden.bs.modal', restore);
