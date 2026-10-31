import copy from 'copy-to-clipboard';
import page from 'page';
import modulePartial from 'node/modules/time_machines/partials/index.html';
import timeMachinePartial from 'node/modules/time_machines/partials/time_machine.html';
import timeMachineActionsPartial from 'node/modules/time_machines/partials/time_machine_actions.html';
import timeMachineDetailsPartial from 'node/modules/time_machines/partials/time_machine_details.html';
import * as timeMachineService from 'node/modules/time_machines/services/time_machine';
import * as userService from 'node/modules/time_machines/services/user';
import { filterListByQuery } from 'utils/list_search';
import { getShareAddress } from 'utils/share_address';

const moduleTemplate = _.template(modulePartial);
const timeMachineTemplate = _.template(timeMachinePartial);
const timeMachineActionsTemplate = _.template(timeMachineActionsPartial);
const timeMachineDetailsTemplate = _.template(timeMachineDetailsPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#time-machines');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const searchInput = module.querySelector('.search');
const listCount = module.querySelector('.list-count');
const table = container.querySelector('.table');
const details = container.querySelector('.details');
let routeTimeMachineName = null;
let searchTimer;
let searchValue = '';
let tableOrder = {
	field: 'name',
	direction: 'asc'
};
let timeMachines = [];
const timeMachineTabs = {};

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const timeMachines = timeMachineService.getTimeMachines();
		const networkInterface = timeMachineService.getDefaultNetworkInterface();
		const jobs = timeMachineService.getJobs();
		render({ timeMachines, networkInterface, jobs });
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
	const timeMachines = timeMachineService.getTimeMachines();
	const networkInterface = timeMachineService.getDefaultNetworkInterface();
	const jobs = timeMachineService.getJobs();
	render({ timeMachines, networkInterface, jobs });
};

const expand = (event) => {
	if (event.target.closest('a, .dropdown')) {
		return;
	}

	const row = event.target.closest('.item');
	if (_.isNull(row)) {
		return;
	}

	event.preventDefault();
	page(`/time-machines/${encodeURIComponent(row.dataset.id)}`);
};

const selectTab = (event) => {
	const button = event.target.closest('[data-time-machine-tab]');
	const name = button?.closest('.item')?.dataset?.id;
	if (!name) {
		return;
	}

	timeMachineTabs[name] = button.dataset.timeMachineTab;
	renderTimeMachineDetails(name);
};

const clearTimeMachineTabs = (name) => {
	_.each(_.keys(timeMachineTabs), (key) => {
		if (_.isUndefined(name) || _.toLower(key) === _.toLower(name)) {
			delete timeMachineTabs[key];
		}
	});
};

const compress = (event) => {
	if (!event.target.closest('button')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	page('/time-machines');
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

const filterJobsByTimeMachine = (jobs, timeMachine) => {
	return _.filter(jobs, (job) => { return job.data?.config?.comment === timeMachine.comment; });
};

const renderTimeMachineDetails = (name) => {
	if (!name) {
		return;
	}

	const timeMachine = _.find(timeMachines, (entry) => { return _.toLower(entry.name) === _.toLower(name); });
	if (!timeMachine) {
		return;
	}

	const jobs = filterJobsByTimeMachine(timeMachineService.getJobs(), timeMachine);
	const users = userService.getUsers();
	const accessOn = getShareAddress(timeMachineService.getSystem());
	const networkMaxBytesPerSec = timeMachineService.getDefaultNetworkInterfaceSpeed();
	morphdom(
		details,
		`<div>${timeMachineDetailsTemplate({ timeMachine, users, jobs, accessOn, networkMaxBytesPerSec, timeMachineTab: timeMachineTabs[name] || 'overview', timeMachineActionsTemplate, prettyBytes, moment })}</div>`,
		{ childrenOnly: true }
	);
};

const hideTimeMachineDetails = () => {
	details.classList.remove('d-block');
	details.innerHTML = '';
};

const render = (state) => {
	if (_.isNull(state.timeMachines)) {
		return;
	}

	timeMachines = state.timeMachines;
	timeMachines = filterListByQuery(timeMachines, searchValue, ['name', 'path', 'comment', 'validUsers']);
	const total = _.size(state.timeMachines);
	const noun = (total === 1 ? 'time machine' : 'time machines');
	listCount.textContent = (_.trim(searchValue) ? `${_.size(timeMachines)} of ${total} ${noun}` : `${total} ${noun}`);
	timeMachines = _.orderBy(timeMachines,
		[
			(timeMachine) => {
				const value = (tableOrder.field === 'backups' ? _.sumBy(timeMachine.timeMachine, (machine) => { return _.size(machine.snapshots || []); }) : _.get(timeMachine, tableOrder.field));
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	const rows = _.join(_.map(timeMachines, (timeMachine) => {
		const jobs = filterJobsByTimeMachine(state.jobs, timeMachine);
		return timeMachineTemplate({ timeMachine, jobs, timeMachineActionsTemplate, prettyBytes, moment });
	}), '');
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${rows}</tbody>`,
		{ childrenOnly: true }
	);

	if (routeTimeMachineName && !_.some(state.timeMachines, (timeMachine) => { return _.toLower(timeMachine.name) === _.toLower(routeTimeMachineName); })) {
		page('/time-machines');
	}

	const detailsTimeMachineName = routeTimeMachineName || container.querySelector('.details .item')?.dataset.id;
	if (detailsTimeMachineName) {
		renderTimeMachineDetails(detailsTimeMachineName);
	}

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

const handleRoute = (ctx) => {
	const name = ctx?.params?.timeMachineName;
	routeTimeMachineName = (_.isEmpty(name) ? null : name);
	if (_.isEmpty(name)) {
		clearTimeMachineTabs();
		hideTimeMachineDetails();
		return;
	}

	clearTimeMachineTabs(name);
	renderTimeMachineDetails(name);
	details.classList.add('d-block');
};

module.onRoute = handleRoute;
module.addEventListener('click', compress);
module.addEventListener('click', selectTab);
searchInput.addEventListener('input', search);
table.querySelector('thead').addEventListener('click', order);
table.querySelector('tbody').addEventListener('click', expand);
container.addEventListener('click', copyToClipboard);

timeMachineService.subscribe([render]);

import('node/modules/time_machines/time_machine_create');
import('node/modules/time_machines/time_machine_update');
import('node/modules/time_machines/time_machine_delete');
