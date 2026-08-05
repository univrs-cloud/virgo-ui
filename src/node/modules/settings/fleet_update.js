import fleetModalPartial from 'node/modules/settings/partials/modals/fleet.html';
import * as configurationService from 'node/modules/settings/services/configuration';

document.querySelector('body').insertAdjacentHTML('beforeend', fleetModalPartial);

const modal = document.querySelector('#fleet');
const form = modal.querySelector('u-form');

const updateFleet = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	const data = form.getData();
	configurationService.updateFleet(data);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
};

const render = (event) => {
	const configuration = configurationService.getConfiguration();
	const isRegistered = !_.isEmpty(configuration?.fleet?.token);
	form.querySelector('.modal-footer u-button[type="submit"]').textContent = (isRegistered ? 'Update' : 'Register');
	modal.querySelector('.fleet-link span').textContent = (isRegistered ? 'View fleet' : 'Create account');
	const email = configuration?.fleet?.email || '';
	form.querySelector('.email').value = email;
	form.querySelector('.email').readonly = !_.isEmpty(email);
};

form.validation = [
	{
		selector: '.email',
		rules: {
			isEmpty: `Can't be empty`,
            isEmail: `Invalid email address`
		}
	},
    {
		selector: '.password',
		rules: {
			isEmpty: `Can't be empty`
		}
	}
];
form.addEventListener('valid', updateFleet);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
