import modulePartial from 'modules/time_machines/partials/index.html';
import timeMachinePartial from 'modules/time_machines/partials/time_machine.html';
import * as timeMachineService from 'modules/time_machines/services/time_machine';
import copy from 'copy-to-clipboard';

const moduleTemplate = _.template(modulePartial);
const timeMachineTemplate = _.template(timeMachinePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#time-machines');
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
		const timeMachines = timeMachineService.getTimeMachines();
		render({ timeMachines });
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
	const timeMachines = timeMachineService.getTimeMachines();
	render({ timeMachines });
};

const copyToClipboard = (event) => {
	if (event.target.closest('a').dataset.action !== 'copy-to-clipboard') {
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
	if (_.isNull(state.timeMachines)) {
		return;
	}
	
	const template = document.createElement('template');
	const networkInterface = state.networkInterface;
	let timeMachines = state.timeMachines;
	const searchTerms = searchValue.toLowerCase().split(/\s+/);
	timeMachines = _.filter(timeMachines, (timeMachines) => {
		const text = `${timeMachines.name || ''}`.toLowerCase();
		const matchesSearch = _.every(searchTerms, (term) => text.includes(term));
		return matchesSearch;
	});
	timeMachines = _.orderBy(timeMachines,
		[
			(timeMachines) => {
				const value = _.get(timeMachines, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	_.each(timeMachines, (timeMachine) => {
		template.innerHTML += timeMachineTemplate({ timeMachine, networkInterface, prettyBytes });
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

timeMachineService.subscribe([render]);

import('modules/time_machines/time_machine_create');
import('modules/time_machines/time_machine_delete');
