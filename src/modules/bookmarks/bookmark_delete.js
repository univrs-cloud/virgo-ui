import * as bookmarkService from 'modules/bookmarks/services/bookmark';

const module = document.querySelector('#bookmarks');

const deleteBookmark = async (event) => {
	if (!event.target.closest('a')?.classList.contains('delete')) {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const card = button.closest('.bookmark');
	const bookmark = _.find(bookmarkService.getBookmarks(), { name: card.dataset.name });

	if (!await confirm(`Are you sure you want to delete the bookmark ${bookmark.title}?`)) {
		return;
	}

	let config = {
		name: bookmark.name
	}
	bookmarkService.deleteBookmark(config);
};

module.addEventListener('click', deleteBookmark);
