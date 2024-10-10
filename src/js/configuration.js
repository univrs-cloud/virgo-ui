import configurationModal from 'partials/modals/configuration.html';
import * as configurationService from 'js/services/configuration';

document.querySelector('body').insertAdjacentHTML('beforeend', configurationModal);

let modal = document.querySelector('#configuration');
let modalBody = modal.querySelector('.modal-body');
let loading = modalBody.querySelector('.loading');
let container = modalBody.querySelector('.container-fluid');

const render = (state) => {
	if (_.isNull(state.configuration)) {
		return;
	}
	
	loading.classList.add('d-none');
	container.classList.remove('d-none');

	let form = container.querySelector('#location');
	form.querySelector('.latitude').value = state.configuration.location.latitude;
	form.querySelector('.longitude').value = state.configuration.location.longitude;
};

render({ configuration: configurationService.getConfiguration() });

configurationService.subscribe([render]);
