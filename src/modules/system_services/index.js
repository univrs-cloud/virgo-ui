import modulePartial from 'modules/system_services/partials/index.html';
import servicePartial from 'modules/system_services/partials/service.html';
import * as serviceService from 'modules/system_services/services/service';

const moduleTemplate = _.template(modulePartial);
const serviceTemplate = _.template(servicePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#system-services');
const loading = module.querySelector('.loading');
const syncButton = module.querySelector('button[data-action="sync"]');
const searchInput = module.querySelector('.search');
const container = module.querySelector('.container-fluid');
const table = container.querySelector('.table');
let searchTimer;
let searchValue = '';
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
		return _.every(searchTerms, (term) => text.includes(term));
	});
	services = _.orderBy(services, [(service) => { return String(service[tableOrder.field] ?? '').toLowerCase(); }], [tableOrder.direction]);
	_.each(services, (service) => {
		template.innerHTML += serviceTemplate({ service });
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
table.querySelector('thead').addEventListener('click', order);

serviceService.subscribe([render]);
