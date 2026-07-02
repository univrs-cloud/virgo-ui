import modulePartial from 'modules/sites/partials/index.html';
import sitePartial from 'modules/sites/partials/site.html';
import * as nodeService from 'modules/sites/services/node';
import { filterListByQuery } from 'utils/list_search';

const moduleTemplate = _.template(modulePartial);
const siteTemplate = _.template(sitePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#sites');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const note = module.querySelector('.note');
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
		render({ nodes: nodeService.getNodes() });
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
	render({ nodes: nodeService.getNodes() });
};

const render = (state) => {
	if (_.isNull(state.nodes)) {
		return;
	}

	let nodes = state.nodes;
	nodes = filterListByQuery(nodes, searchValue, ['name', 'nodeId']);
	nodes = _.orderBy(nodes,
		[
			(node) => {
				const value = _.get(node, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);

	note.classList.toggle('d-none', !_.isEmpty(state.nodes));
	note.textContent = `You don't have access to any sites yet.`;

	const rows = _.join(_.map(nodes, (node) => { return siteTemplate({ node }); }), '');
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

nodeService.subscribe([render]);

import('modules/sites/site_access');
import('modules/sites/site_delete');
