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

const performAction = (event) => {
	event.preventDefault();
	let button = event.currentTarget;
	let card = button.closest('.card');
	if (button.classList.contains('text-danger') && !confirm(`Are you sure you want to ${button.dataset.action} ${card.dataset.title}?`)) {
		return;
	}

	let config = {
		id: card.dataset.id,
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
	loading.classList.add('d-none');
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);
	_.each(module.querySelectorAll('.dropdown-menu a:not(.disabled)'), (button) => {
		button.addEventListener('click', performAction);
	});
};

render({ apps: appService.getApps() });

appService.subscribe([render]);

import('modules/apps/app_center');
