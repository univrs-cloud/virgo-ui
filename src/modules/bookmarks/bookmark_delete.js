import * as bookmarkService from 'modules/bookmarks/services/bookmark';

let module = document.querySelector('#bookmarks');

const deleteBookmark = (event) => {
	if (!event.target.closest('a')?.classList.contains('delete')) {
		return;
	}

	event.preventDefault();
	let button = event.target;
	let card = button.closest('.bookmark');
	let bookmark = _.find(bookmarkService.getBookmarks(), { name: card.dataset.name });

	if (!confirm(`Are you sure you want to delete the bookmark ${bookmark.title}?`)) {
		return;
	}

	let config = {
		name: bookmark.name
	}
	bookmarkService.deleteBookmark(config);
};

module.addEventListener('click', deleteBookmark);
