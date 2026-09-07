import modulePartial from 'node/modules/shortcuts/partials/index.html';
import shortcutPartial from 'node/modules/shortcuts/partials/shortcut.html';
import * as shortcutService from 'node/modules/shortcuts/services/shortcut';
import { filterListByQuery } from 'utils/list_search';

const moduleTemplate = _.template(modulePartial);
const shortcutTemplate = _.template(shortcutPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#shortcuts');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const searchInput = module.querySelector('.search');
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
		const shortcuts = shortcutService.getShortcuts();
		const jobs = shortcutService.getJobs();
		render({ shortcuts, jobs });
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
	const shortcuts = shortcutService.getShortcuts();
	const jobs = shortcutService.getJobs();
	render({ shortcuts, jobs });
};

const render = (state) => {
	if (_.isNull(state.shortcuts)) {
		return;
	}
	
	let shortcuts = state.shortcuts;
	shortcuts = filterListByQuery(shortcuts, searchValue, ['title', 'name', 'url', 'icon', 'category']);
	shortcuts = _.orderBy(shortcuts,
		[
			(shortcut) => {
				const value = _.get(shortcut, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	const rows = _.join(_.map(shortcuts, (shortcut) => {
		const jobs = _.filter(state.jobs, (job) => { return job.data?.config?.title === shortcut.title; });
		return shortcutTemplate({ shortcut, jobs, prettyBytes });
	}), '');
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${rows}</tbody>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

searchInput.addEventListener('input', search);
table.querySelector('thead').addEventListener('click', order);

shortcutService.subscribe([render]);

import('node/modules/shortcuts/shortcut_create');
import('node/modules/shortcuts/shortcut_update');
import('node/modules/shortcuts/shortcut_delete');
