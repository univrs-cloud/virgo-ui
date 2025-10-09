import bookmarkModalPartial from 'modules/bookmarks/partials/modals/bookmark_update.html';
import * as bookmarkService from 'modules/bookmarks/services/bookmark';
import isEmpty from 'validator/es/lib/isEmpty';

document.querySelector('body').insertAdjacentHTML('beforeend', bookmarkModalPartial);

let form = document.querySelector('#bookmark-update');
let bookmark;

const validateTitle = (event) => {
	let input = form.querySelector('.title');
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

const validateUrl = (event) => {
	let input = form.querySelector('.url');
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

const validateForm = () => {
	validateTitle();
	validateUrl();
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(form.querySelectorAll('.is-invalid'));
};

const updateBookmark = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	let form = event.target;
	let buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	let config = {
		name: bookmark.name,
		category: form.querySelector('.category').value,
		title: form.querySelector('.title').value,
		url: form.querySelector('.url').value
	};

	bookmarkService.updateBookmark(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
};

const render = (event) => {
	let name = event.relatedTarget.closest('.bookmark').dataset.name;
	let bookmarks = bookmarkService.getBookmarks();
	bookmark = _.find(bookmarks, { name: name });
	form.querySelector('.title').value = bookmark.title;
	form.querySelector('.url').value = bookmark.url;
	form.querySelector('.category').value = bookmark.category;
};

const restore = (event) => {
	bookmark = null;
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(form.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		input.querySelector('.invalid-feedback').innerHTML = '';
	});
};

form.querySelector('.title').addEventListener('input', validateTitle);
form.querySelector('.url').addEventListener('input', validateUrl);
form.addEventListener('submit', updateBookmark);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
