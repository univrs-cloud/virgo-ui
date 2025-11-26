import bookmarkModalPartial from 'modules/bookmarks/partials/modals/bookmark_update.html';
import * as bookmarkService from 'modules/bookmarks/services/bookmark';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', bookmarkModalPartial);

const form = document.querySelector('#bookmark-update');
let bookmark;

const validateTitle = (event) => {
	const input = form.querySelector('.title');
	const value = input.value;
	if (validator.isEmpty(value.toString())) {
		input.error = `Can't be empty`;
		return;
	}
	input.error = ``;
};

const validateUrl = (event) => {
	const input = form.querySelector('.url');
	const value = input.value;
	if (validator.isEmpty(value.toString())) {
		input.error = `Can't be empty`;
		return;
	}
	input.error = ``;
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

	const form = event.target;
	const buttons = form.querySelectorAll('button');
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
	const name = event.relatedTarget.closest('.bookmark').dataset.name;
	const bookmarks = bookmarkService.getBookmarks();
	bookmark = _.find(bookmarks, { name: name });
	form.querySelector('.title').value = bookmark.title;
	form.querySelector('.url').value = bookmark.url;
	form.querySelector('.category').value = bookmark.category;
};

const restore = (event) => {
	bookmark = null;
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(form.querySelectorAll('.form-floating'), (field) => {
		field.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		field.querySelector('.invalid-feedback').innerHTML = '';
	});
};

form.querySelector('.title').addEventListener('input', validateTitle);
form.querySelector('.url').addEventListener('input', validateUrl);
form.addEventListener('submit', updateBookmark);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
