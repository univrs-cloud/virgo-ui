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
		username: form.querySelector('.username').value,
		fullname: form.querySelector('.fullname').value,
		email: form.querySelector('.email').value
	};

	userService.updateProfile(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
	document.querySelector('.toast-container').insertAdjacentHTML('beforeend',
		`<div class="toast bd-green-500 border-0" data-bs-autohide="true">
			<div class="d-flex">
				<div class="toast-body">Profile saved.</div>
				<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
			</div>
		</div>`
	);
	let toast = new bootstrap.Toast(document.querySelector('.toast-container .toast:last-of-type'));
	toast.show();
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
	let profile = _.find(users, { username: account.user });
	profileForm.querySelector('.title-username').innerHTML = profile.username;
	profileForm.querySelector('.username').value = profile.username;
	profileForm.querySelector('.fullname').value = profile.fullname || profile.username;
	profileForm.querySelector('.email').value = account.email ?? '';
};

profileForm.querySelector('.fullname').addEventListener('input', validateFullname);
profileForm.querySelector('.email').addEventListener('input', validateEmailAddress);
profileForm.addEventListener('submit', updateProfile);
profileForm.addEventListener('show.bs.modal', render);
profileForm.addEventListener('hidden.bs.modal', restore);
