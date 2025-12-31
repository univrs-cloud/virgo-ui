import modulePartial from 'modules/folders/partials/index.html';
import folderPartial from 'modules/folders/partials/folder.html';
import * as folderService from 'modules/folders/services/folder';
import copy from 'copy-to-clipboard';

const moduleTemplate = _.template(modulePartial);
const folderTemplate = _.template(folderPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#folders');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const searchInput = module.querySelector('.search');
const table = container.querySelector('.table');
let searchTimer;
let searchValue = '';
let tableOrder = {
	field: 'name',
	direction: 'asc'
};

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const folders = folderService.getFolders();
		render({ folders });
	}, 300);
};

const order = (event) => {
	if (_.isNull(event.target.closest('.orderable'))) {
		return;
	}
	
	const cell = event.target.closest('.orderable');
	const field = cell.dataset.field;
	tableOrder.field = field;
	
	// Determine direction: if already sorted, toggle; otherwise use default from data attribute
	if (cell.matches('.asc, .desc')) {
		// Already sorted, toggle direction
		tableOrder.direction = (cell.classList.contains('asc') ? 'desc' : 'asc');
	} else {
		// First time sorting this column, use default direction from data attribute (or 'asc' if not specified)
		tableOrder.direction = cell.dataset.defaultOrder || 'asc';
	}
	
	_.each(table.querySelectorAll('thead th'), (cell) => { cell.classList.remove('asc', 'desc'); });
	cell.classList.add(tableOrder.direction);
	const folders = folderService.getFolders();
	render({ folders });
};

const copyToClipboard = (event) => {
	if (event.target.closest('a')?.dataset.action !== 'copy-to-clipboard') {
		return;
	}

	event.preventDefault();
	const button = event.target.closest('a');
	const text = button.nextElementSibling.innerHTML;
	if (copy(text)) {
		const tooltip = bootstrap.Tooltip.getInstance(button);
		const originalTitle = button.dataset.bsOriginalTitle;
		tooltip.setContent({ '.tooltip-inner': 'Copied!' });
		setTimeout(() => {
			tooltip.hide();
			tooltip.setContent({ '.tooltip-inner': originalTitle });
		}, 1000);
	}
};

const render = (state) => {
	if (_.isNull(state.folders)) {
		return;
	}
	
	const template = document.createElement('template');
	const networkInterface = state.networkInterface;
	let folders = state.folders;
	const searchTerms = searchValue.toLowerCase().split(/\s+/);
	folders = _.filter(folders, (folder) => {
		const text = `${folder.name || ''} ${folder.path || ''}`.toLowerCase();
		const matchesSearch = _.every(searchTerms, (term) => text.includes(term));
		return matchesSearch;
	});
	folders = _.orderBy(folders,
		[
			(folder) => {
				const value = _.get(folder, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	_.each(folders, (folder) => {
		template.innerHTML += folderTemplate({ folder, networkInterface, prettyBytes });
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
table.addEventListener('click', copyToClipboard);

folderService.subscribe([render]);

import('modules/folders/folder_create');
import('modules/folders/folder_delete');
