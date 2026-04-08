import trustedProxyModalPartial from 'modules/network/partials/modals/trusted_proxy_edit.html';
import * as networkService from 'modules/network/services/network';

document.querySelector('body').insertAdjacentHTML('beforeend', trustedProxyModalPartial);
const modal = document.querySelector('#trusted-proxy-edit');
const form = modal.querySelector('u-form');

const render = (event) => {
	const row = event.relatedTarget?.closest('.item');
	if (!row) {
		return;
	}

	const address = row.dataset.id;
	form.querySelector('.address').value = address;
	form.querySelector('.current-address').textContent = address;
};

const updateTrustedProxy = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	let config = form.getData();
	networkService.updateTrustedProxy(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
	form.querySelector('.current-address').textContent = '';
};

form.validation = [
	{
		selector: '.to-address',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				validate: (value, input, formEl) => {
					const ignoreAddress = formEl.querySelector('.address')?.value;
					const normalizedNew = value?.toString().trim().toLowerCase();
					const normalizedCurrent = ignoreAddress?.toString().trim().toLowerCase();
					if (normalizedNew === normalizedCurrent) {
						return `Must differ from the current address`;
					}

					if (networkService.isTrustedProxyAddressTaken(value, ignoreAddress)) {
						return `Must be unique`;
					}
					
					return true;
				}
			}
		}
	}
];

form.addEventListener('valid', updateTrustedProxy);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
