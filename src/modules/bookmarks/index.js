import modulePartial from 'modules/bookmarks/partials/index.html';
import emptyPartial from 'modules/bookmarks/partials/empty.html';
import bookmarkPartial from 'modules/bookmarks/partials/bookmark.html';
import * as bookmarkService from 'modules/bookmarks/services/bookmark';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const bookmarkTemplate = _.template(bookmarkPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#bookmarks');
const loading = module.querySelector('.loading');
const searchInput = module.querySelector('.search');
const container = module.querySelector('.container-fluid');
const table = container.querySelector('.table');
let searchTimer;
let searchValue = '';
let tableOrder = {
	field: 'title',
	direction: 'asc'
};

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const bookmarks = bookmarkService.getBookmarks();
		render({ bookmarks });
	}, 300);
};

const order = (event) => {
	if (_.isNull(event.target.closest('.orderable'))) {
		return;
	}
	
	const cell = event.target.closest('.orderable');
	tableOrder.field = cell.dataset.field;
	tableOrder.direction = (cell.classList.contains('asc') ? 'desc' : 'asc');
	_.each(table.querySelectorAll('thead th'), (cell) => { cell.classList.remove('asc', 'desc'); });
	cell.classList.add(tableOrder.direction);
	const bookmarks = bookmarkService.getBookmarks();
	render({ bookmarks });
};

const render = (state) => {
	if (_.isNull(state.bookmarks)) {
		return;
	}
	
	const template = document.createElement('template');
	let bookmarks = state.bookmarks;
	const searchTerms = searchValue.toLowerCase().split(/\s+/);
	bookmarks = _.filter(bookmarks, (bookmark) => {
		const text = `${bookmark.title || ''}`.toLowerCase();
		const matchesSearch = _.every(searchTerms, (term) => text.includes(term));
		return matchesSearch;
	});
	bookmarks = _.orderBy(bookmarks,
		[
			(bookmark) => {
				const value = _.get(bookmark, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	_.each(bookmarks, (bookmark) => {
		const jobs = _.filter(state.jobs, (job) => { return job.data?.config?.name === bookmark.name; });
		template.innerHTML += bookmarkTemplate({ bookmark, jobs, prettyBytes });
	});
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${template.innerHTML}</tbody>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

searchInput.addEventListener('input', search);
table.querySelector('thead').addEventListener('click', order);

bookmarkService.subscribe([render]);

import('modules/bookmarks/bookmark_create');
import('modules/bookmarks/bookmark_update');
import('modules/bookmarks/bookmark_delete');
