import modulePartial from 'modules/nodes/partials/index.html';
import nodePartial from 'modules/nodes/partials/node.html';
import * as nodeService from 'modules/nodes/services/node';
import { filterListByQuery } from 'utils/list_search';

const moduleTemplate = _.template(modulePartial);
const nodeTemplate = _.template(nodePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#nodes');
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
		const nodes = nodeService.getNodes();
		const jobs = nodeService.getJobs();
		render({ nodes, jobs });
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
	const nodes = nodeService.getNodes();
	const jobs = nodeService.getJobs();
	render({ nodes, jobs });
};

const render = (state) => {
	if (_.isNull(state.nodes)) {
		return;
	}
	
	let nodes = state.nodes;
	nodes = filterListByQuery(nodes, searchValue, ['name']);
	nodes = _.orderBy(nodes,
		[
			(node) => {
				const value = _.get(node, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	const rows = _.join(_.map(nodes, (node) => {
		const jobs = _.filter(state.jobs, (job) => { return job.data?.config?.id === node.id; });
		return nodeTemplate({ node, jobs });
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

nodeService.subscribe([render]);
