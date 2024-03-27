import storePartial from '../partials/app_center.html';
import itemPartial from '../partials/app_center_item.html';
import * as appStoreService from './services/app_center';

document.querySelector('body').insertAdjacentHTML('beforeend', storePartial);

let modal = document.querySelector('#app-center');
let modalBody = modal.querySelector('.modal-body');
let loading = modalBody.querySelector('.loading');
let oops = modalBody.querySelector('.oops');
let row = modalBody.querySelector('.row');
const template = _.template(itemPartial);

const render = (state) => {
	if (_.isNull(state.templates)) {
		return;
	}

	loading.classList.add('d-none');
	_.each(_.orderBy(state.templates, 'title'), (app) => {
		row.insertAdjacentHTML('beforeend', template({ app }));
	});
	_.each(modalBody.querySelectorAll('.install'), (button) => {
		button.addEventListener('click', (event) => {
			event.preventDefault();
		});
	});
};

appStoreService.subscribe([render]);
