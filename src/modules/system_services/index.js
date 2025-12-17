import modulePartial from 'modules/system_services/partials/index.html';
import servicePartial from 'modules/system_services/partials/service.html';
import filterPartial from 'modules/system_services/partials/filter.html';
import * as serviceService from 'modules/system_services/services/service';

const moduleTemplate = _.template(modulePartial);
const serviceTemplate = _.template(servicePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate({ filterPartial }));
const module = document.querySelector('#system-services');
const loading = module.querySelector('.loading');
const syncButton = module.querySelector('button[data-action="sync"]');
const searchInput = module.querySelector('.search');
const filterStateSelect = module.querySelectorAll('.filter-state');
const filterUnitFileStateSelect = module.querySelectorAll('.filter-unit-file-state');
const container = module.querySelector('.container-fluid');
const table = container.querySelector('.table');
let searchTimer;
let searchValue = '';
let filterStateValue = '';
let filterUnitFileStateValue = '';
let tableOrder = {
	field: 'unit',
	direction: 'asc'
};

const sync = (event) => {
	event.preventDefault();
	syncButton.disabled = true;
	syncButton.querySelector('.icon-arrows-rotate').classList.add('icon-spin');
	serviceService.syncServices();
};

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const services = serviceService.getServices();
		render({ services });
	}, 300);
};

const filterState = (event) => {
	filterStateValue = event.target.value;
	const services = serviceService.getServices();
	render({ services });
};

const filterUnitFileState = (event) => {
	filterUnitFileStateValue = event.target.value;
	const services = serviceService.getServices();
	render({ services });
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
	const services = serviceService.getServices();
	render({ services });
};

const render = (state) => {
	if (_.isNull(state.services)) {
		return;
	}

	const template = document.createElement('template');
	let services = state.services;
	const searchTerms = searchValue.toLowerCase().split(/\s+/);
	services = _.filter(services, (service) => {
		const text = `${service.unit || ''} ${service.description || ''}`.toLowerCase();
		const matchesSearch = _.every(searchTerms, (term) => text.includes(term));
		const matchesState = filterStateValue === '' || service.state === filterStateValue;
		const matchesUnitFileState = filterUnitFileStateValue === '' || service.unitFileState === filterUnitFileStateValue;
		return matchesSearch && matchesState && matchesUnitFileState;
	});
	services = _.orderBy(services,
		[
			(service) => {
				const value = _.get(service, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	_.each(services, (service) => {
		template.innerHTML += serviceTemplate({ service, prettyBytes });
	});

	morphdom(
		table.querySelector('tbody'),
		`<tbody>${template.innerHTML}</tbody>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	syncButton.disabled = false;
	syncButton.querySelector('.icon-arrows-rotate').classList.remove('icon-spin');
	container.classList.remove('d-none');
};

syncButton.addEventListener('click', sync);
searchInput.addEventListener('input', search);
_.each(filterStateSelect, (radio) => { radio.addEventListener('change', filterState); });
_.each(filterUnitFileStateSelect, (radio) => { radio.addEventListener('change', filterUnitFileState); });
table.querySelector('thead').addEventListener('click', order);

serviceService.subscribe([render]);
