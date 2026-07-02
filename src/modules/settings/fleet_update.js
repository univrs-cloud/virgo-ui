import fleetModalPartial from 'modules/settings/partials/modals/fleet.html';
import * as configurationService from 'modules/settings/services/configuration';

document.querySelector('body').insertAdjacentHTML('beforeend', fleetModalPartial);

const modal = document.querySelector('#fleet');
const form = modal.querySelector('u-form');
const credentialsSection = form.querySelector('.fleet-credentials');
const credentialsHint = form.querySelector('.fleet-credentials-hint');

const updateCredentialsVisibility = (fleet) => {
	const needsCredentials = form.querySelector('.enabled').checked && !fleet?.registered;
	credentialsSection.classList.toggle('d-none', !needsCredentials);
	credentialsHint.classList.toggle('d-none', !needsCredentials);
};

const updateFleet = () => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	const fleet = configurationService.getConfiguration()?.fleet || {};
	const config = form.getData();
	config.enabled = Boolean(form.querySelector('.enabled').checked);
	if (!config.enabled || fleet.registered) {
		delete config.password;
	}
	configurationService.updateFleet(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = () => {
	form.reset();
	credentialsSection.classList.remove('d-none');
	credentialsHint.classList.add('d-none');
};

const render = () => {
	const fleet = configurationService.getConfiguration()?.fleet || {};
	form.querySelector('.enabled').checked = Boolean(fleet.enabled);
	form.querySelector('.email').value = fleet.email || '';
	form.querySelector('.password').value = '';
	updateCredentialsVisibility(fleet);
};

form.validation = [
	{
		selector: '.email',
		rules: {
			custom: {
				message: 'Invalid email address',
				validate: (value, input, form) => {
					const fleet = configurationService.getConfiguration()?.fleet || {};
					const enabled = form.querySelector('.enabled').checked;
					if (!enabled || fleet.registered) {
						return true;
					}
					return form.validator.isEmail(value);
				}
			}
		}
	},
	{
		selector: '.password',
		rules: {
			custom: {
				message: `Can't be empty`,
				validate: (value, input, form) => {
					const fleet = configurationService.getConfiguration()?.fleet || {};
					const enabled = form.querySelector('.enabled').checked;
					if (!enabled || fleet.registered) {
						return true;
					}
					return !form.validator.isEmpty(value);
				}
			}
		}
	}
];

form.querySelector('.enabled').addEventListener('change', () => {
	updateCredentialsVisibility(configurationService.getConfiguration()?.fleet || {});
});
form.addEventListener('valid', updateFleet);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
