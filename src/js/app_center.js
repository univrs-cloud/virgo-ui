import appCenterModal from '../partials/modals/app_center.html';
import itemPartial from '../partials/modals/app_center_item.html';
import * as appCenterService from './services/app_center';

document.querySelector('body').insertAdjacentHTML('beforeend', appCenterModal);

const itemTemplate = _.template(itemPartial);
let modal = document.querySelector('#app-center');
let modalBody = modal.querySelector('.modal-body');
let loading = modalBody.querySelector('.loading');
let row = modalBody.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.templates)) {
		return;
	}

	loading.classList.add('d-none');
	_.each(_.orderBy(state.templates, 'title'), (app) => {
		row.insertAdjacentHTML('beforeend', itemTemplate({ app }));
	});
	_.each(modalBody.querySelectorAll('.install'), (button) => {
		button.addEventListener('click', (event) => {
			event.preventDefault();
			let config = {};
			appCenterService.install(config);
		});
	});
};

appCenterService.subscribe([render]);
