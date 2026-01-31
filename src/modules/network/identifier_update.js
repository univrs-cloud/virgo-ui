import identifierModalPartial from 'modules/network/partials/modals/identifier.html';
import * as networkService from 'modules/network/services/network';

document.querySelector('body').insertAdjacentHTML('beforeend', identifierModalPartial);

const modal = document.querySelector('#network-identifier');
const form = modal.querySelector('u-form');

const updateIdentifier = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
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
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
