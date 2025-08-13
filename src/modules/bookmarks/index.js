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

const render = (state) => {
	if (_.isNull(state.bookmarks)) {
		return;
	}
	
	let template = document.createElement('template');
	if (_.isEmpty(state.bookmarks)) {
		template.innerHTML = emptyTemplate();
	} else {
		_.each(state.bookmarks, (bookmark) => {
			let jobs = _.filter(state.jobs, (job) => { return job.data?.config?.name === bookmark.name; });
			template.innerHTML += bookmarkTemplate({ bookmark, jobs });
		});
	}
	
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

bookmarkService.subscribe([render]);

import('modules/bookmarks/bookmark_create');
import('modules/bookmarks/bookmark_update');
import('modules/bookmarks/bookmark_delete');
