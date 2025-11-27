import locationModalPartial from 'modules/settings/partials/modals/location.html';
import * as configurationService from 'modules/settings/services/configuration';

document.querySelector('body').insertAdjacentHTML('beforeend', locationModalPartial);

const modal = document.querySelector('#location');
const form = modal.closest('u-form');

const getLocation = (event) => {
	event.preventDefault();
	navigator.geolocation.getCurrentPosition(
		(position) => {
			form.querySelector('.latitude').value = position.coords.latitude;
			form.querySelector('.longitude').value = position.coords.longitude;
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

const updateLocation = (event) => {
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = form.getData();
	configurationService.updateLocation(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
};

const render = (event) => {
	const configuration = configurationService.getConfiguration();
	form.querySelector('.latitude').value = configuration?.location?.latitude || '';
	form.querySelector('.longitude').value = configuration?.location?.longitude || '';
};

if ('geolocation' in navigator) {
	form.querySelector('.get-geo-location').classList.remove('d-none');
}

form.validation = [
	{
		selector: '.latitude',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				message: `Invalid latitude`,
				validate: (value, input, form) => {
					return form.validator.isLatLong(`${value},0.0`);
				}
			}
		}
	},
	{
		selector: '.longitude',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				message: `Invalid longitude`,
				validate: (value, input, form) => {
					return form.validator.isLatLong(`0.0,${value}`);
				}
			}
		}
	}
];
form.addEventListener('valid', updateLocation);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
form.querySelector('.get-geo-location').addEventListener('click', getLocation);
