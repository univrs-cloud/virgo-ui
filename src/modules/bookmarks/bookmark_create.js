import bookmarkModalPartial from 'modules/bookmarks/partials/modals/bookmark_create.html';
import * as bookmarkService from 'modules/bookmarks/services/bookmark';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', bookmarkModalPartial);

let form = document.querySelector('#bookmark-create');

const validateTitle = (event) => {
	let input = form.querySelector('.title');
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

const validateUrl = (event) => {
	let input = form.querySelector('.url');
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

	let form = event.target;
	let buttons = form.querySelectorAll('button');
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
	_.each(form.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		input.querySelector('.invalid-feedback').innerHTML = '';
	});
};

form.querySelector('.title').addEventListener('input', validateTitle);
form.querySelector('.url').addEventListener('input', validateUrl);
form.addEventListener('submit', createBookmark);
form.addEventListener('hidden.bs.modal', restore);
