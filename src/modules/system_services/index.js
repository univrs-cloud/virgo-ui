import modulePartial from 'modules/system_services/partials/index.html';
import servicePartial from 'modules/system_services/partials/service.html';
import * as serviceService from 'modules/system_services/services/service';

const moduleTemplate = _.template(modulePartial);
const serviceTemplate = _.template(servicePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#system-services');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const table = container.querySelector('.table');
let tableOrder = {
	field: 'unit',
	direction: 'asc'
};

const order = (event) => {
	if (!event.target.classList.contains('orderable')) {
		return;
	}
	
	const cell = event.target;
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
	state.services = _.orderBy(state.services, [(service) => { return String(service[tableOrder.field] ?? '').toLowerCase(); }], [tableOrder.direction]);
	_.each(state.services, (service) => {
		template.innerHTML += serviceTemplate({ service });
	});

	morphdom(
		table.querySelector('tbody'),
		`<tbody>${template.innerHTML}</tbody>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

table.querySelector('thead').addEventListener('click', order);

serviceService.subscribe([render]);
