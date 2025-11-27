import identifierModalPartial from 'modules/network/partials/modals/identifier.html';
import * as networkService from 'modules/network/services/network';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', identifierModalPartial);

const modal = document.querySelector('#network-identifier');
const form = modal.closest('u-form');

const updateIdentifier = (event) => {
	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	let config = form.getData();
	networkService.updateHostIdentifier(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const render = (event) => {
	const system = networkService.getSystem();
	form.querySelector('.hostname').value = system?.osInfo?.hostname;
	form.querySelector('.domain-name').value = _.replace(system?.osInfo?.fqdn, `${system?.osInfo?.hostname}.`, '');
};

const restore = (event) => {
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
};

form.validation = [
	{
		selector: '.hostname',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
	{
		selector: '.domain-name',
		rules: {
			isEmpty: `Can't be empty`
		}
	}
];
form.addEventListener('valid', updateIdentifier);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
