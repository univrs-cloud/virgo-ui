import userModalPartial from 'modules/users/partials/modals/user_update.html';
import * as userService from 'modules/users/services/user';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', userModalPartial);

let userForm = document.querySelector('#user-update');
let user;

const validateFullname = (event) => {
	let input = userForm.querySelector('.fullname');
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
	let input = userForm.querySelector('.email');
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
	return _.isEmpty(userForm.querySelectorAll('.is-invalid'));
};

const updateUser = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	let form = event.target;
	let buttons = form.querySelectorAll('button');
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
	let uid = event.relatedTarget.closest('.user').dataset.uid;
	let users = userService.getUsers();
	user = _.find(users, { uid: Number(uid) });
	userForm.querySelector('.fullname').value = user.fullname;
	userForm.querySelector('.email').value = user.email;
};

const restore = (event) => {
	user = null;
	userForm.reset();
	_.each(userForm.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(userForm.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		input.querySelector('.invalid-feedback').innerHTML = '';
	});
};

userForm.querySelector('.fullname').addEventListener('input', validateFullname);
userForm.querySelector('.email').addEventListener('input', validateEmailAddress);
userForm.addEventListener('submit', updateUser);
userForm.addEventListener('show.bs.modal', render);
userForm.addEventListener('hidden.bs.modal', restore);
