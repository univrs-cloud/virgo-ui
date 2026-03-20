import page from 'page';
import modulePartial from 'modules/system_services/partials/index.html';
import servicePartial from 'modules/system_services/partials/service.html';
import serviceDetailsPartial from 'modules/system_services/partials/service_details.html';
import filterPartial from 'modules/system_services/partials/service_filter.html';
import * as serviceService from 'modules/system_services/services/service';

const moduleTemplate = _.template(modulePartial);
const serviceTemplate = _.template(servicePartial);
const serviceDetailsTemplate = _.template(serviceDetailsPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate({ filterPartial }));
const module = document.querySelector('#system-services');
const loading = module.querySelector('.loading');
const syncButton = module.querySelector('button[data-action="sync"]');
const container = module.querySelector('.container-fluid');
const details = container.querySelector('.details');
const searchInput = module.querySelector('.search');
const filterStateSelect = module.querySelectorAll('.filter-state');
const filterUnitFileStateSelect = module.querySelectorAll('.filter-unit-file-state');
const table = container.querySelector('.table');
let searchTimer;
let searchValue = '';
let filterStateValue = '';
let filterUnitFileStateValue = '';
let tableOrder = {
	field: 'unit',
	direction: 'asc'
};
let services = [];

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
	const services = serviceService.getServices();
	render({ services });
};

const expand = (event) => {
	if (event.target.closest('a, .dropdown')) {
		return;
	}

	event.preventDefault();
	const row = event.target.closest('.service');
	const unit = row.dataset.unit;
	page(`/system-services/${encodeURIComponent(unit)}`);
};

const compress = (event) => {
	if (!event.target.closest('button')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	page('/system-services');
};

const renderServiceDetails = (unit) => {
	if (!unit) {
		return;
	}

	const service = _.find(services, { unit });
	if (!service) {
		return;
	}

	morphdom(
		details,
		`<div>${serviceDetailsTemplate({ service, prettyBytes })}</div>`,
		{
			childrenOnly: true,
			onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('logs-container')) {
					return false;
				}
			}
		}
	);
};

const hideServiceDetails = () => {
	module.dispatchEvent(new CustomEvent('details:hide'));
	details.classList.remove('d-block');
	details.innerHTML = '';
};

const render = (state) => {
	if (_.isNull(state.services)) {
		return;
	}

	const template = document.createElement('template');
	services = state.services;
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

	const serviceContainer = container.querySelector('.details .item');
	if (serviceContainer) {
		renderServiceDetails(serviceContainer.dataset.name);
	}

	loading.classList.add('d-none');
	syncButton.disabled = false;
	syncButton.querySelector('.icon-arrows-rotate').classList.remove('icon-spin');
	container.classList.remove('d-none');
};

const handleRoute = (ctx) => {
	const unit = ctx?.params?.serviceUnit;
	if (_.isEmpty(unit)) {
		hideServiceDetails();
		return;
	}

	renderServiceDetails(unit);
	details.classList.add('d-block');
};

module.onRoute = handleRoute;
module.addEventListener('click', compress);
syncButton.addEventListener('click', sync);
searchInput.addEventListener('input', search);
_.each(filterStateSelect, (radio) => { radio.addEventListener('change', filterState); });
_.each(filterUnitFileStateSelect, (radio) => { radio.addEventListener('change', filterUnitFileState); });
table.querySelector('thead').addEventListener('click', order);
table.querySelector('tbody').addEventListener('click', expand);

serviceService.subscribe([render]);

import('modules/system_services/logs');
