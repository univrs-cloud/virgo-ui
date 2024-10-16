import appCenterModal from 'partials/modals/app_center.html';
import itemPartial from 'partials/modals/app_center_item.html';
import * as appCenterService from 'js/services/app_center';

document.querySelector('body').insertAdjacentHTML('beforeend', appCenterModal);

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
	template.innerHTML = _.join(_.map(_.orderBy(state.templates, 'title'), (app) => {
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
