import trustedProxyModalPartial from 'modules/network/partials/modals/trusted_proxy_add.html';
import * as networkService from 'modules/network/services/network';

document.querySelector('body').insertAdjacentHTML('beforeend', trustedProxyModalPartial);
const modal = document.querySelector('#trusted-proxy-add');
const form = modal.querySelector('u-form');

const addTrustedProxy = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	const config = form.getData();
	networkService.addTrustedProxy(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
};

form.validation = [
	{
		selector: '.address',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				validate: (value) => {
					return !networkService.isTrustedProxyAddressTaken(value);
				},
				message: `Must be unique`
			}
		}
	}
];

form.addEventListener('valid', addTrustedProxy);
modal.addEventListener('hidden.bs.modal', restore);
