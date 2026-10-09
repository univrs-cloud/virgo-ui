import page from 'page';
import modulePartial from 'node/modules/system_services/partials/index.html';
import servicePartial from 'node/modules/system_services/partials/service.html';
import serviceActionsPartial from 'node/modules/system_services/partials/service_actions.html';
import serviceDetailsPartial from 'node/modules/system_services/partials/service_details.html';
import filterPartial from 'node/modules/system_services/partials/service_filter.html';
import filterOptionsPartial from 'node/modules/system_services/partials/service_filter_options.html';
import filterPillsPartial from 'node/modules/system_services/partials/service_filter_pills.html';
import * as serviceService from 'node/modules/system_services/services/service';
import { filterListByQuery } from 'utils/list_search';

const moduleTemplate = _.template(modulePartial);
const serviceTemplate = _.template(servicePartial);
const serviceActionsTemplate = _.template(serviceActionsPartial);
const serviceDetailsTemplate = _.template(serviceDetailsPartial);
const filterOptionsTemplate = _.template(filterOptionsPartial);
const filterPillsTemplate = _.template(filterPillsPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate({ filterPartial }));
const module = document.querySelector('#system-services');
const loading = module.querySelector('.loading');
const syncButton = module.querySelector('button[data-action="sync"]');
const container = module.querySelector('.container-fluid');
const details = container.querySelector('.details');
const searchInput = module.querySelector('.search');
const filterMenu = module.querySelector('.filter-menu');
const filterBadge =module.querySelector('.filter-toggle');
const filterPills = module.querySelector('.filter-pills');
const filterTypeNav = module.querySelector('.filter-type');
const table = container.querySelector('.table');
let routeServiceUnit = null;
let searchTimer;
let searchValue = '';
const storedFilters = serviceService.getFilters();
let filterType = storedFilters.type;
const filterGroups = [
	{ key: 'sub', order: ['running', 'dead', 'exited', 'failed', 'listening', 'waiting', 'active', 'elapsed'] },
	{ key: 'unitFileState', order: ['enabled', 'disabled', 'static', 'enabled-runtime', 'indirect', 'generated', 'masked', 'unknown'] }
];
let filters = { sub: storedFilters.sub, unitFileState: storedFilters.unitFileState };
let tableOrder = {
	field: 'memory.percent',
	direction: 'desc'
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
		const jobs = serviceService.getJobs();
		render({ services, jobs });
	}, 300);
};

const toggleFilter = (event) => {
	const input = event.target.closest('input[data-filter-key]');
	if (!input) {
		return;
	}

	const key = input.dataset.filterKey;
	filters[key] = (input.checked ? _.union(filters[key], [input.value]) : _.without(filters[key], input.value));
	serviceService.setFilters({ type: filterType, ...filters });
	const services = serviceService.getServices();
	const jobs = serviceService.getJobs();
	render({ services, jobs });
};

const selectType = (event) => {
	const button = event.target.closest('button[data-filter-type]');
	if (!button) {
		return;
	}

	filterType = button.dataset.filterType;
	_.each(filterTypeNav.querySelectorAll('.nav-link'), (link) => { link.classList.toggle('active', link === button); });
	const services = serviceService.getServices();
	const jobs = serviceService.getJobs();
	const typedServices = _.filter(services, matchesType);
	filters = _.mapValues(filters, (values, key) => { return _.intersection(values, _.map(typedServices, (service) => { return filterValue(service, key); })); });
	serviceService.setFilters({ type: filterType, ...filters });
	render({ services, jobs });
};

const removeFilter = (event) => {
	const button = event.target.closest('button[data-filter-key], button[data-action="clear-filters"]');
	if (!button) {
		return;
	}

	if (button.dataset.action === 'clear-filters') {
		filters = _.mapValues(filters, () => { return []; });
	} else {
		filters[button.dataset.filterKey] = [];
	}
	serviceService.setFilters({ type: filterType, ...filters });
	const services = serviceService.getServices();
	const jobs = serviceService.getJobs();
	render({ services, jobs });
};

const filterValue = (service, key) => {
	return String(service[key] ?? '').toLowerCase();
};

const matchesType = (service) => {
	return _.isEmpty(filterType) || filterValue(service, 'type') === filterType;
};

const matchesFilters = (service, exceptKey) => {
	return _.every(filterGroups, (group) => {
		return group.key === exceptKey || _.isEmpty(filters[group.key]) || filters[group.key].includes(filterValue(service, group.key));
	});
};

const renderFilters = (allServices, searchedServices) => {
	const groups = _.map(filterGroups, (group) => {
		const present = _.union(_.compact(_.map(allServices, (service) => { return filterValue(service, group.key); })), filters[group.key]);
		const values = _.union(_.intersection(group.order, present), _.sortBy(present));
		const counts = _.countBy(_.filter(searchedServices, (service) => { return matchesFilters(service, group.key); }), (service) => { return filterValue(service, group.key); });
		return {
			key: group.key,
			selected: filters[group.key],
			options: _.map(values, (value) => {
				return { value, count: counts[value] || 0, selected: filters[group.key].includes(value) };
			})
		};
	});
	const selectedCount = _.sumBy(groups, (group) => { return group.selected.length; });

	morphdom(filterMenu, `<ul>${filterOptionsTemplate({ groups })}</ul>`, { childrenOnly: true });
	morphdom(filterPills, `<div>${(selectedCount > 0 ? filterPillsTemplate({ groups }) : '')}</div>`, { childrenOnly: true });
	filterPills.classList.toggle('md:d-flex', selectedCount > 0);
	filterBadge.classList.toggle('active', selectedCount > 0);
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
	const jobs = serviceService.getJobs();
	render({ services, jobs });
};

const expand = (event) => {
	if (event.target.closest('a, .dropdown')) {
		return;
	}

	event.preventDefault();
	const row = event.target.closest('.item');
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

const performServiceAction = async (event) => {
	const button = event.target.closest('a[data-action]');
	if (!button || button.classList.contains('disabled')) {
		return;
	}

	event.preventDefault();
	const row = button.closest('.item');
	const service = _.find(services, { unit: row.dataset.unit });

	const actionLabel = _.upperFirst(button.dataset.action.replace('-', ' & '));
	if (
		button.classList.contains('confirm') &&
		!await confirm(`Are you sure you want to ${actionLabel.toLowerCase()} the service ${service.unit}?`, { buttons: [{ text: actionLabel, class: (button.classList.contains('confirm') ? 'btn-solid theme-danger' : 'btn-solid theme-primary') }] })
	) {
		return;
	}

	serviceService.performServiceAction({ unit: service.unit, action: button.dataset.action });
};

const renderServiceDetails = (unit) => {
	if (!unit) {
		return;
	}

	const service = _.find(services, { unit });
	if (!service) {
		return;
	}

	const jobs = _.filter(serviceService.getJobs(), (job) => { return job.data?.config?.unit === service.unit; });
	morphdom(
		details,
		`<div>${serviceDetailsTemplate({ service, jobs, serviceActionsTemplate, prettyBytes })}</div>`,
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

	services = state.services;
	services = filterListByQuery(services, searchValue, ['unit', 'description', 'active', 'sub', 'type', 'unitFileState']);
	services = _.filter(services, matchesType);
	renderFilters(_.filter(state.services, matchesType), services);
	services = _.filter(services, (service) => { return matchesFilters(service); });
	services = _.orderBy(services,
		[
			(service) => {
				const value = _.get(service, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);

	const rows = _.join(_.map(services, (service) => {
		const jobs = _.filter(state.jobs, (job) => job.data?.config?.unit === service.unit);
		return serviceTemplate({ service, jobs, serviceActionsTemplate, prettyBytes });
	}), '');
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${rows}</tbody>`,
		{ childrenOnly: true }
	);

	const detailsServiceUnit = routeServiceUnit || container.querySelector('.details .item')?.dataset.unit;
	if (detailsServiceUnit) {
		renderServiceDetails(detailsServiceUnit);
	}

	loading.classList.add('d-none');
	syncButton.disabled = false;
	syncButton.querySelector('.icon-arrows-rotate').classList.remove('icon-spin');
	container.classList.remove('d-none');
};

const handleRoute = (ctx) => {
	const unit = ctx?.params?.serviceUnit;
	routeServiceUnit = (_.isEmpty(unit) ? null : unit);
	if (_.isEmpty(unit)) {
		hideServiceDetails();
		return;
	}

	renderServiceDetails(unit);
	details.classList.add('d-block');
};

_.each(filterTypeNav.querySelectorAll('.nav-link'), (link) => { link.classList.toggle('active', link.dataset.filterType === filterType); });

module.onRoute = handleRoute;
module.addEventListener('click', compress);
module.addEventListener('click', performServiceAction);
syncButton.addEventListener('click', sync);
searchInput.addEventListener('input', search);
filterTypeNav.addEventListener('click', selectType);
filterMenu.addEventListener('change', toggleFilter);
filterPills.addEventListener('click', removeFilter);
table.querySelector('thead').addEventListener('click', order);
table.querySelector('tbody').addEventListener('click', expand);

serviceService.subscribe([render]);

import('node/modules/system_services/logs');
