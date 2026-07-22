import fleetModalPartial from 'node/modules/settings/partials/modals/fleet.html';
import * as configurationService from 'node/modules/settings/services/configuration';

document.querySelector('body').insertAdjacentHTML('beforeend', fleetModalPartial);

const modal = document.querySelector('#fleet');
const form = modal.querySelector('u-form');

const updateFleet = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	let config = form.getData();
	configurationService.updateFleet(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
};

const render = (event) => {
	const configuration = configurationService.getConfiguration();
	const registered = !_.isNull(configuration?.fleet);
	form.querySelector('.modal-footer u-button[type="submit"]').textContent = (registered ? 'Update' : 'Register');
	modal.querySelector('.fleet-link span').textContent = (registered ? 'View fleet' : 'Create account');
	const email = configuration?.fleet?.email || '';
	form.querySelector('.email').value = email;
	form.querySelector('.email').readonly = !_.isNull(configuration?.fleet) && !_.isEmpty(email);
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
