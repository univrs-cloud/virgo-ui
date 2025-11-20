import bookmarkModalPartial from 'modules/bookmarks/partials/modals/bookmark_create.html';
import * as bookmarkService from 'modules/bookmarks/services/bookmark';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', bookmarkModalPartial);

const form = document.querySelector('#bookmark-create');

const validateTitle = (event) => {
	const input = form.querySelector('.title');
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

const validateUrl = (event) => {
	const input = form.querySelector('.url');
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

const validateForm = () => {
	validateTitle();
	validateUrl();
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(form.querySelectorAll('.is-invalid'));
};

const createBookmark = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	let config = {
		category: form.querySelector('.category').value,
		title: form.querySelector('.title').value,
		url: form.querySelector('.url').value
	};

	bookmarkService.createBookmark(config);
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

form.querySelector('.title').addEventListener('input', validateTitle);
form.querySelector('.url').addEventListener('input', validateUrl);
form.addEventListener('submit', createBookmark);
form.addEventListener('hidden.bs.modal', restore);
