import bookmarkModalPartial from 'modules/bookmarks/partials/modals/bookmark_create.html';
import * as bookmarkService from 'modules/bookmarks/services/bookmark';

document.querySelector('body').insertAdjacentHTML('beforeend', bookmarkModalPartial);

const modal = document.querySelector('#bookmark-create');
const form = modal.closest('u-form');

const createBookmark = (event) => {
	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = form.getData();
	bookmarkService.createBookmark(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
};

form.validation = [
	{
		selector: '.title',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
	{
		selector: '.url',
		rules: {
			isEmpty: `Can't be empty`
		}
	}
];
form.addEventListener('valid', createBookmark);
form.addEventListener('hidden.bs.modal', restore);
