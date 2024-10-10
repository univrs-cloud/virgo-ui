import configurationModal from 'partials/modals/configuration.html';
import * as configurationService from 'js/services/configuration';

document.querySelector('body').insertAdjacentHTML('beforeend', configurationModal);

let modal = document.querySelector('#configuration');
let modalBody = modal.querySelector('.modal-body');
let loading = modalBody.querySelector('.loading');
let container = modalBody.querySelector('.container-fluid');
let locationForm = container.querySelector('#location');

const setLocation = (event) => {
	event.preventDefault();
	let form = event.target;
	let submitButton = form.querySelector('button[type="submit"]');
	submitButton.disabled = true;
	let config = {
		latitude: form.querySelector('.latitude').value,
		longitude: form.querySelector('.longitude').value
	}
	configurationService.setLocation(config);
	submitButton.disabled = false;
	document.querySelector('.toast-container').insertAdjacentHTML('beforeend',
		`<div class="toast bd-green-500 border-0" data-bs-autohide="true">
			<div class="d-flex">
				<div class="toast-body">Location saved.</div>
				<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
			</div>
		</div>`
	);
	let toast = new bootstrap.Toast(document.querySelector('.toast-container .toast:last-of-type'));
	toast.show();
};

const render = (state) => {
	if (_.isNull(state.configuration)) {
		return;
	}
	
	loading.classList.add('d-none');
	container.classList.remove('d-none');

	
	locationForm.querySelector('.latitude').value = state.configuration.location.latitude;
	locationForm.querySelector('.longitude').value = state.configuration.location.longitude;
};

locationForm.addEventListener('submit', setLocation);

render({ configuration: configurationService.getConfiguration() });

configurationService.subscribe([render]);
