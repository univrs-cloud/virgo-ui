import page from 'page';
import modulePartial from 'modules/apps/partials/index.html';
import appPartial from 'modules/apps/partials/app.html';
import appActionsPartial from 'modules/apps/partials/app_actions.html';
import appDetailsPartial from 'modules/apps/partials/app_details.html';
import * as appService from 'modules/apps/services/app';

const moduleTemplate = _.template(modulePartial);
const appTemplate = _.template(appPartial);
const appActionsTemplate = _.template(appActionsPartial);
const appDetailsTemplate = _.template(appDetailsPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#apps');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const details = container.querySelector('.details');
const searchInput = module.querySelector('.search');
const table = container.querySelector('.table');
let searchTimer;
let searchValue = '';
let tableOrder = {
	field: 'title',
	direction: 'asc'
};
let apps = [];

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const apps = appService.getApps();
		render({ apps });
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
	const apps = appService.getApps();
	render({ apps });
};

const expand = (event) => {
	if (event.target.closest('a, .dropdown')) {
		return;
	}

	event.preventDefault();
	const row = event.target.closest('.app');
	const name = row.dataset.name;
	page(`/apps/${encodeURIComponent(name)}`);
};

const compress = (event) => {
	if (!event.target.closest('button')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	page('/apps');
};

const update = (event) => {
	if (!_.isNull(event.target.closest('.service'))) {
		return;
	}

	if (event.target.closest('a')?.dataset.action !== 'update') {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const row = button.closest('.app');
	const app = _.find(appService.getApps(), { name: row.dataset.name });

	let config = {
		name: app.name
	};
	appService.update(config);
};

const performAppAction = async (event) => {
	if (!_.isNull(event.target.closest('.service'))) {
		return;
	}

	if (
		!event.target.closest('a')?.classList?.contains('dropdown-item') ||
		event.target.closest('a')?.dataset.action === undefined ||
		event.target.closest('a')?.dataset.action === 'update'
	) {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const row = button.closest('.app');
	const app = _.find(appService.getApps(), { name: row.dataset.name });
	
	const actionMessage = (button.dataset.action === 'uninstall' ? '<br><br>Data will <strong>NOT</strong> be deleted.' : '');
	if (
		button.classList.contains('confirm') &&
		!await confirm(`Are you sure you want to ${button.dataset.action} the app ${app.title}?${actionMessage}`, { buttons: [{ text: _.upperFirst(button.dataset.action), class: (button.classList.contains('confirm') ? 'btn-danger' : 'btn-primary') }] })
	) {
		return;
	}

	let config = {
		name: app.name,
		action: button.dataset.action
	};
	appService.performAppAction(config);
};

const performServiceAction = async (event) => {
	if (_.isNull(event.target.closest('.service'))) {
		return;
	}

	if (!event.target.closest('a')?.classList.contains('dropdown-item')) {
		return;
	}

	event.preventDefault();
	const button = event.target;
	const row = button.closest('.service');
	const service = _.find(_.flatMap(appService.getApps(), 'projectContainers'), { id: row.dataset.id });

	if (
		button.classList.contains('confirm') &&
		!await confirm(`Are you sure you want to ${button.dataset.action} the service ${service.labels?.comDockerComposeService}?`, { buttons: [{ text: _.upperFirst(button.dataset.action), class: (button.classList.contains('confirm') ? 'btn-danger' : 'btn-primary') }] })
	) {
		return;
	}

	let config = {
		id: service.id,
		action: button.dataset.action
	};
	appService.performServiceAction(config);
};

const renderAppDetails = (name) => {
	if (!name) {
		return;
	}

	const app = _.find(apps, { name });
	if (!app) {
		return;
	}

	const jobs = _.filter(appService.getJobs(), (job) => { return job.data?.config?.name === app.name; });
	morphdom(
		details,
		`<div>${appDetailsTemplate({ app, jobs, appActionsTemplate, prettyBytes, moment })}</div>`,
		{
			childrenOnly: true,
			onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('logs-container') || fromEl.classList.contains('terminal-container')) {
					return false;
				}
			}
		}
	);
};

const hideAppDetails = () => {
	details.classList.remove('d-block');
	details.innerHTML = '';
};

const render = (state) => {
	if (_.isNull(state.apps)) {
		return;
	}
	
	const template = document.createElement('template');
	apps = state.apps;
	const searchTerms = searchValue.toLowerCase().split(/\s+/);
	apps = _.filter(apps, (app) => {
		const text = `${app.title || ''}`.toLowerCase();
		const matchesSearch = _.every(searchTerms, (term) => text.includes(term));
		return matchesSearch;
	});
	apps = _.orderBy(apps,
		[
			(app) => {
				const value = _.get(app, tableOrder.field);
				return typeof value === 'number' ? value : String(value ?? '').toLowerCase();
			}
		],
		[tableOrder.direction]
	);
	_.each(apps, (app) => {
		const jobs = _.filter(state.jobs, (job) => { return job.data?.config?.name === app.name; });
		template.innerHTML += appTemplate({ app, jobs, appActionsTemplate, prettyBytes });
	});
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${template.innerHTML}</tbody>`,
		{ childrenOnly: true }
	);

	const appContainer = container.querySelector('.details .app');
	if (appContainer) {
		renderAppDetails(appContainer.dataset.name);
	}
	
	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

const handleRoute = (ctx) => {
	const name = ctx?.params?.appName
	if (_.isEmpty(name)) {
		hideAppDetails();
		return;
	}

	renderAppDetails(name);
	details.classList.add('d-block');
};

module.onRoute = handleRoute;
module.addEventListener('click', compress);
module.addEventListener('click', update);
module.addEventListener('click', performAppAction);
module.addEventListener('click', performServiceAction);
searchInput.addEventListener('input', search);
table.querySelector('thead').addEventListener('click', order);
table.querySelector('tbody').addEventListener('click', expand);

appService.subscribe([render]);

import('modules/apps/logs');
import('modules/apps/terminal');
import('modules/apps/app_center');
import('modules/apps/app_install');
