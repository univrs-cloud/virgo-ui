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

const performAction = (event) => {
	if (!event.target.closest('a')?.classList.contains('dropdown-item')) {
		return;
	}

	event.preventDefault();
	let button = event.target;
	let app = button.closest('.app');
	if (button.classList.contains('text-danger') && !confirm(`Are you sure you want to ${button.dataset.action} ${app.dataset.title}?`)) {
		return;
	}

	let config = {
		id: app.dataset.id,
		composeProject: app.dataset.composeProject,
		action: button.dataset.action
	};
	appService.performAction(config);
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
			template.innerHTML += appTemplate({ app });
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
							if (fromEl.classList.contains('terminal-container')) {
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

render({ apps: appService.getApps() });

appService.subscribe([render]);

module.addEventListener('click', expand);
module.addEventListener('click', compress);
module.addEventListener('click', performAction);

import('modules/apps/console');
import('modules/apps/app_center');
import('modules/apps/app_install');
