import locationModalPartial from 'modules/settings/partials/modals/location.html';
import * as configurationService from 'modules/settings/services/configuration';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', locationModalPartial);

const timeouts = {};
const form = document.querySelector('#location');

const validateLatitude = (event) => {
	if (event) {
		clearTimeout(timeouts['latitude']);
		timeouts['latitude'] = setTimeout(checkValidity, 300);
		return;
	}

	checkValidity();

	function checkValidity() {
		const input = form.querySelector('.latitude');
		const value = input.value;
		if (validator.isEmpty(value.toString())) {
			input.error = `Can't be empty`;
			return;
		}
		if (!validator.isLatLong(`${value},0.0`)) {
			input.error = `Invalid latitude`;
			return;
		}
		input.error = ``;
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
		const input = form.querySelector('.longitude');
		const value = input.value;
		if (validator.isEmpty(value.toString())) {
			input.error = `Can't be empty`;
			return;
		}
		if (!validator.isLatLong(`0.0,${value}`)) {
			input.error = `Invalid longitude`;
			return;
		}
		input.error = ``;
	}
};

const validateForm = () => {
	validateLatitude();
	validateLongitude();
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(form.querySelectorAll('.is-invalid'));
};

const updateLocation = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = {
		latitude: form.querySelector('.latitude').value,
		longitude: form.querySelector('.longitude').value
	}
	configurationService.updateLocation(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
};

const getLocation = (event) => {
	event.preventDefault();
	navigator.geolocation.getCurrentPosition(
		(position) => {
			form.querySelector('.latitude').value = position.coords.latitude;
			form.querySelector('.longitude').value = position.coords.longitude;
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
			const toast = new bootstrap.Toast(document.querySelector('.toast-container .toast:last-of-type'));
			toast.show();
		}
	);
};

const restore = (event) => {
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(form.querySelectorAll('.form-floating'), (field) => {
		field.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		field.querySelector('.invalid-feedback').innerHTML = '';
	});
};

const render = (event) => {
	const configuration = configurationService.getConfiguration();
	form.querySelector('.latitude').value = configuration?.location?.latitude || '';
	form.querySelector('.longitude').value = configuration?.location?.longitude || '';
};

if ('geolocation' in navigator) {
	form.querySelector('.get-geo-location').classList.remove('d-none');
}

form.querySelector('.get-geo-location').addEventListener('click', getLocation);
form.querySelector('.latitude').addEventListener('input', validateLatitude);
form.querySelector('.longitude').addEventListener('input', validateLongitude);
form.addEventListener('submit', updateLocation);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
