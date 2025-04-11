import profileModalPartial from 'modules/users/profile/partials/modals/edit.html';
import * as userService from 'modules/users/services/user';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', profileModalPartial);

let profileForm = document.querySelector('#profile-edit');

const validateFullname = (event) => {
	let input = profileForm.querySelector('.fullname');
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

const validateEmailAddress = (event) => {
	let input = profileForm.querySelector('.email');
	let invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	let value = input.value;
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

const validateForm = () => {
	validateFullname();
	validateEmailAddress();
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(profileForm.querySelectorAll('.is-invalid'));
};

const updateProfile = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	let form = event.target;
	let buttons = form.querySelectorAll('button');
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
	profileForm.reset();
	_.each(profileForm.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(profileForm.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		input.querySelector('.invalid-feedback').innerHTML = '';
	});
};

const render = (event) => {
	let users = userService.getUsers();
	let user = _.find(users, { username: account.user });
	profileForm.querySelector('.title-username').innerHTML = user.username;
	profileForm.querySelector('.fullname').value = user.fullname || user.username;
	profileForm.querySelector('.email').value = user.email;
};

profileForm.querySelector('.fullname').addEventListener('input', validateFullname);
profileForm.querySelector('.email').addEventListener('input', validateEmailAddress);
profileForm.addEventListener('submit', updateProfile);
profileForm.addEventListener('show.bs.modal', render);
profileForm.addEventListener('hidden.bs.modal', restore);
