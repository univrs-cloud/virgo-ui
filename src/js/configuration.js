import configurationModal from 'partials/modals/configuration.html';
import * as configurationService from 'js/services/configuration';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', configurationModal);

const timeouts = {};
let modal = document.querySelector('#configuration');
let modalBody = modal.querySelector('.modal-body');
let loading = modalBody.querySelector('.loading');
let container = modalBody.querySelector('.container-fluid');
let locationForm = container.querySelector('#location');

const validateLatitude = (event) => {
	if (event) {
		clearTimeout(timeouts['latitude']);
		timeouts['latitude'] = setTimeout(checkValidity, 300);
		return;
	}

	checkValidity();

	function checkValidity() {
		let input = locationForm.querySelector('.latitude');
		let invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
		let value = input.value;
		if (validator.isEmpty(value)) {
			input.classList.remove('is-valid');
			input.classList.add('is-invalid');
			invalidFeedback.innerHTML = `Can't be empty`;
			return;
		}
		if (!validator.isLatLong(`${value},0.0`)) {
			input.classList.remove('is-valid');
			input.classList.add('is-invalid');
			invalidFeedback.innerHTML = `Invalid latitude`;
			return;
		}
		input.classList.remove('is-invalid');
		input.classList.add('is-valid');
	}
};

const validateLongitude = (event) => {
	if (event) {
		clearTimeout(timeouts['longitude']);
		timeouts['longitude'] = setTimeout(checkValidity, 300);
		return;
	}

	checkValidity();

	function checkValidity() {
		let input = locationForm.querySelector('.longitude');
		let invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
		let value = input.value;
		if (validator.isEmpty(value)) {
			input.classList.remove('is-valid');
			input.classList.add('is-invalid');
			invalidFeedback.innerHTML = `Can't be empty`;
			return;
		}
		if (!validator.isLatLong(`0.0,${value}`)) {
			input.classList.remove('is-valid');
			input.classList.add('is-invalid');
			invalidFeedback.innerHTML = `Invalid longitude`;
			return;
		}
		input.classList.remove('is-invalid');
		input.classList.add('is-valid');
	}
};

const validateForm = () => {
	validateLatitude();
	validateLongitude();
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(locationForm.querySelectorAll('.is-invalid'));
};

const setLocation = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	let form = event.target;
	let submitButton = form.querySelector('button[type="submit"]');
	submitButton.disabled = true;
	let config = {
		latitude: form.querySelector('.latitude').value,
		longitude: form.querySelector('.longitude').value
	}
	configurationService.setLocation(config);
	submitButton.disabled = false;
	_.each(locationForm.querySelectorAll('input'), (element) => { element.classList.remove('is-valid'); });
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

const getLocation = (event) => {
	event.preventDefault();
	navigator.geolocation.getCurrentPosition(
		(position) => {
			locationForm.querySelector('.latitude').value = position.coords.latitude;
			locationForm.querySelector('.longitude').value = position.coords.longitude;
			validateForm();
		},
		() => {
			document.querySelector('.toast-container').insertAdjacentHTML('beforeend',
				`<div class="toast bd-red-500 border-0" data-bs-autohide="false">
					<div class="d-flex">
						<div class="toast-body">Unable to retrieve your location.<br>Reset permission and try again.</div>
						<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
					</div>
				</div>`
			);
			let toast = new bootstrap.Toast(document.querySelector('.toast-container .toast:last-of-type'));
			toast.show();
		}
	);
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

if ('geolocation' in navigator) {
	locationForm.querySelector('.get-geo-location').classList.remove('d-none');
}

render({ configuration: configurationService.getConfiguration() });

configurationService.subscribe([render]);

locationForm.querySelector('.get-geo-location').addEventListener('click', getLocation);
locationForm.querySelector('.latitude').addEventListener('input', validateLatitude);
locationForm.querySelector('.longitude').addEventListener('input', validateLongitude);
locationForm.addEventListener('submit', setLocation);
