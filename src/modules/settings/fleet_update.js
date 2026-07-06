import fleetModalPartial from 'modules/settings/partials/modals/fleet.html';
import * as configurationService from 'modules/settings/services/configuration';

document.querySelector('body').insertAdjacentHTML('beforeend', fleetModalPartial);

const modal = document.querySelector('#fleet');
const form = modal.querySelector('u-form');

const updateFleet = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	let config = form.getData();
    console.log(config);
	// configurationService.updateFleet(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
};

const render = (event) => {
	const configuration = configurationService.getConfiguration();
	form.querySelector('.modal-footer u-button[type="submit"]').textContent = (!_.isNull(configuration?.fleet) ? 'Update' : 'Register');
	form.querySelector('.email').value = configuration?.fleet?.email || '';
	form.querySelector('.email').readonly = !_.isNull(configuration?.fleet);
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
