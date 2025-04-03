import modulePartial from 'modules/bookmarks/partials/index.html';
import emptyPartial from 'modules/bookmarks/partials/empty.html';
import bookmarkPartial from 'modules/bookmarks/partials/bookmark.html';
import * as bookmarkService from 'modules/bookmarks/services/bookmark';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const bookmarkTemplate = _.template(bookmarkPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
let module = document.querySelector('#bookmarks');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');
let row = container.querySelector('.row');

const performAction = (event) => {
	event.preventDefault();
	let button = event.currentTarget;
	let bookmark = button.closest('.bookmark');
	if (button.classList.contains('text-danger') && !confirm(`Are you sure you want to ${button.dataset.action} ${bookmark.dataset.title}?`)) {
		return;
	}

	let config = {
		id: bookmark.dataset.id,
		action: button.dataset.action
	};
	// bookmarkService.performAction(config);
};

const render = (state) => {
	if (_.isNull(state.bookmarks)) {
		return;
	}
	
	let template = document.createElement('template');
	if (_.isEmpty(state.bookmarks)) {
		template.innerHTML = emptyTemplate();
	} else {
		_.each(state.bookmarks, (bookmark) => {
			template.innerHTML += bookmarkTemplate({ bookmark });
		});
	}
	
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');

	_.each(module.querySelectorAll('.dropdown-menu a:not(.disabled)'), (button) => {
		button.addEventListener('click', performAction);
	});
};

render({ bookmarks: bookmarkService.getBookmarks() });

bookmarkService.subscribe([render]);
