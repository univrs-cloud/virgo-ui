import * as bookmarkService from 'modules/bookmarks/services/bookmark';

const module = document.querySelector('#bookmarks');

const deleteBookmark = async (event) => {
	if (event.target.closest('a')?.dataset.action !== 'delete') {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const row = button.closest('.bookmark');
	const bookmark = _.find(bookmarkService.getBookmarks(), { name: row.dataset.name });

	if (!await confirm(`Are you sure you want to delete the bookmark ${bookmark.title}?`, { buttons: [{ text: 'Remove', class: 'btn-danger' }] })) {
		return;
	}

	let config = {
		name: bookmark.name
	}
	bookmarkService.deleteBookmark(config);
};

module.addEventListener('click', deleteBookmark);
