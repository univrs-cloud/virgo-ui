import locationModalPartial from 'modules/settings/partials/modals/location.html';
import * as configurationService from 'modules/settings/services/configuration';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', locationModalPartial);

const timeouts = {};
let locationForm = document.querySelector('#location');

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
	let buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = {
		latitude: form.querySelector('.latitude').value,
		longitude: form.querySelector('.longitude').value
	}
	configurationService.setLocation(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
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
						<div class="toast-body">Unable to retrieve your location.<br>Reset permissions and try again.</div>
						<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
					</div>
				</div>`
			);
			let toast = new bootstrap.Toast(document.querySelector('.toast-container .toast:last-of-type'));
			toast.show();
		}
	);
};

const restore = (event) => {
	locationForm.reset();
	_.each(locationForm.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(locationForm.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		input.querySelector('.invalid-feedback').innerHTML = '';
	});
};

const render = (event) => {
	let configuration = configurationService.getConfiguration();
	locationForm.querySelector('.latitude').value = configuration?.location?.latitude ?? '';
	locationForm.querySelector('.longitude').value = configuration?.location?.longitude ?? '';
};

if ('geolocation' in navigator) {
	locationForm.querySelector('.get-geo-location').classList.remove('d-none');
}

locationForm.querySelector('.get-geo-location').addEventListener('click', getLocation);
locationForm.querySelector('.latitude').addEventListener('input', validateLatitude);
locationForm.querySelector('.longitude').addEventListener('input', validateLongitude);
locationForm.addEventListener('submit', setLocation);
locationForm.addEventListener('show.bs.modal', render);
locationForm.addEventListener('hidden.bs.modal', restore);
