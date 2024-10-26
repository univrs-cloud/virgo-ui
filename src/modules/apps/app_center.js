import appCenterModalPartial from 'modules/apps/partials/modal/app_center.html';
import itemPartial from 'modules/apps/partials/modal/app_center_item.html';
import * as appCenterService from 'modules/apps/services/app_center';

document.querySelector('body').insertAdjacentHTML('beforeend', appCenterModalPartial);

const itemTemplate = _.template(itemPartial);
let modal = document.querySelector('#app-center');
let modalBody = modal.querySelector('.modal-body');
let loading = modalBody.querySelector('.loading');
let row = modalBody.querySelector('.row');

const install = (event) => {
	if (!event.target.classList.contains('install')) {
		return;
	}
	
	event.preventDefault();
	let config = {};
	appCenterService.install(config);
};

const render = (state) => {
	if (_.isNull(state.templates)) {
		return;
	}

	let template = document.createElement('template');
	template.innerHTML = _.join(_.map(state.templates, (app) => {
		return itemTemplate({ app });
	}), '');

	loading.classList.add('d-none');
	morphdom(
		row,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);
};

modalBody.addEventListener('click', install);

appCenterService.subscribe([render]);
