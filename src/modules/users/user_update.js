import userModalPartial from 'modules/users/partials/modals/user_update.html';
import * as userService from 'modules/users/services/user';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', userModalPartial);

let form = document.querySelector('#user-update');
let user;

const validateFullname = (event) => {
	let input = form.querySelector('.fullname');
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
	let input = form.querySelector('.email');
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
	return _.validator.isEmpty(form.querySelectorAll('.is-invalid'));
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
	form.querySelector('.fullname').value = user.fullname;
	form.querySelector('.email').value = user.email;
};

const restore = (event) => {
	user = null;
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(form.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		input.querySelector('.invalid-feedback').innerHTML = '';
	});
};

form.querySelector('.fullname').addEventListener('input', validateFullname);
form.querySelector('.email').addEventListener('input', validateEmailAddress);
form.addEventListener('submit', updateUser);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
