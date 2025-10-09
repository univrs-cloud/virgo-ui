import passwordModalPartial from 'modules/users/profile/partials/modals/password.html';
import * as userService from 'modules/users/services/user';
import isEmpty from 'validator/es/lib/isEmpty';
import equals from 'validator/es/lib/equals';

document.querySelector('body').insertAdjacentHTML('beforeend', passwordModalPartial);

let form = document.querySelector('#profile-password');

const validatePassword = (event) => {
	let input = form.querySelector('.password');
	let invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	let value = input.value;
	if (isEmpty(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	input.classList.remove('is-invalid');
	input.classList.add('is-valid');
};

const validatePasswordCheck = (event) => {
	let input = form.querySelector('.password-check');
	let invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	let value = input.value;
	if (isEmpty(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	if (!equals(value, form.querySelector('.password').value)) {
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
	return _.isEmpty(form.querySelectorAll('.is-invalid'));
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
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(form.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		input.querySelector('.invalid-feedback').innerHTML = '';
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
