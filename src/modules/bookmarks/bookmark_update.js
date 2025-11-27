import bookmarkModalPartial from 'modules/bookmarks/partials/modals/bookmark_update.html';
import * as bookmarkService from 'modules/bookmarks/services/bookmark';

document.querySelector('body').insertAdjacentHTML('beforeend', bookmarkModalPartial);

const modal = document.querySelector('#bookmark-update');
const form = modal.closest('u-form');

const updateBookmark = (event) => {
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = form.getData();
	bookmarkService.updateBookmark(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const render = (event) => {
	const name = event.relatedTarget.closest('.bookmark').dataset.name;
	const bookmark = _.find(bookmarkService.getBookmarks(), { name: name });
	form.querySelector('.name').value = bookmark.name;
	form.querySelector('.title').value = bookmark.title;
	form.querySelector('.url').value = bookmark.url;
	form.querySelector('.category').value = bookmark.category;
};

const restore = (event) => {
	bookmark = null;
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
form.addEventListener('valid', updateBookmark);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
