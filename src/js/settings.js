import settingsModal from '../partials/modals/settings.html';
import * as settingsService from './services/settings';

document.querySelector('body').insertAdjacentHTML('beforeend', settingsModal);

let modal = document.querySelector('#settings');
let modalBody = modal.querySelector('.modal-body');
let loading = modalBody.querySelector('.loading');
let container = modalBody.querySelector('.container-fluid');

const render = (state) => {
	if (_.isNull(state.settings)) {
		return;
	}

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

render({ settings: settingsService.getSettings() });

settingsService.subscribe([render]);
