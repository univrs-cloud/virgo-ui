import modulePartial from 'modules/apps/partials/index.html';
import emptyPartial from 'modules/apps/partials/empty.html';
import appPartial from 'modules/apps/partials/app.html';
import * as appService from 'modules/apps/services/app';

const moduleTemplate = _.template(modulePartial);
const emptyTemplate = _.template(emptyPartial);
const appTemplate = _.template(appPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
let module = document.querySelector('#apps');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');
let row = container.querySelector('.row');

const expand = (event) => {
	if (!event.target.closest('span')?.classList.contains('expand')) {
		return;
	}

	event.preventDefault();
	let button = event.target;
	let item = button.closest('.item');
	item.closest('.row').classList.add('expand');
	item.classList.add('expand');
};

const compress = (event) => {
	if (!event.target.closest('span')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	let button = event.target;
	let item = button.closest('.item');
	item.classList.remove('expand');
	item.closest('.row').classList.remove('expand');
};

const update = (event) => {
	if (!_.isNull(event.target.closest('.service'))) {
		return;
	}

	if (!event.target.closest('a')?.classList.contains('update')) {
		return;
	}

	event.preventDefault();
	let button = event.target;
	let card = button.closest('.app');
	let app = _.find(appService.getApps(), { name: card.dataset.name });

	let config = {
		name: app.name
	};
	appService.update(config);
};

const performAppAction = async (event) => {
	if (!_.isNull(event.target.closest('.service'))) {
		return;
	}

	if (!event.target.closest('a')?.classList.contains('dropdown-item') || event.target.closest('a').dataset.action === undefined) {
		return;
	}

	event.preventDefault();
	let button = event.target;
	let card = button.closest('.app');
	let app = _.find(appService.getApps(), { name: card.dataset.name });

	let action = (button.dataset.action === 'down' ? 'remove' : button.dataset.action);
	let actionMessage = (button.dataset.action === 'down' ? '\n\nData will not deleted.' : '');
	if (button.classList.contains('text-danger') && !await confirm(`Are you sure you want to ${action} the app ${app.title}?${actionMessage}`)) {
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
	let button = event.target;
	let card = button.closest('.service');
	let service = _.find(_.flatMap(appService.getApps(), 'projectContainers'), { id: card.dataset.id });

	if (button.classList.contains('text-danger') && !await confirm(`Are you sure you want to ${button.dataset.action} the service ${service.name}?`)) {
		return;
	}

	let config = {
		id: service.id,
		action: button.dataset.action
	};
	appService.performServiceAction(config);
};

const render = (state) => {
	if (_.isNull(state.apps)) {
		return;
	}
	
	let template = document.createElement('template');
	if (_.isEmpty(state.apps)) {
		template.innerHTML = emptyTemplate();
	} else {
		_.each(state.apps, (app) => {
			let jobs = _.filter(state.jobs, (job) => { return job.data?.config?.name === app.name; });
			template.innerHTML += appTemplate({ app, jobs });
		});
	}
	
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{
			childrenOnly: true,
			onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('expand')) {
					morphdom(fromEl, toEl, {
						childrenOnly: true,
						onBeforeElUpdated: (fromEl, toEl) => {
							if (fromEl.classList.contains('logs-container') || fromEl.classList.contains('terminal-container')) {
								return false;
							}
						}
					});
					return false;
				}
			}
		}
	);
	
	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

module.addEventListener('click', expand);
module.addEventListener('click', compress);
module.addEventListener('click', update);
module.addEventListener('click', performAppAction);
module.addEventListener('click', performServiceAction);

appService.subscribe([render]);

import('modules/apps/logs');
import('modules/apps/console');
import('modules/apps/app_center');
import('modules/apps/app_install');
