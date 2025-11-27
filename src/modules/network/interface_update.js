import interfaceModalPartial from 'modules/network/partials/modals/interface.html';
import * as networkService from 'modules/network/services/network';
import { Netmask } from 'netmask';

document.querySelector('body').insertAdjacentHTML('beforeend', interfaceModalPartial);

const modal = document.querySelector('#network-interface');
const form = modal.closest('u-form');

const updateInterface = (event) => {
	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	let config = form.getData();
	const isDhcp = (config.method === 'auto');
	config.ipAddress = (!isDhcp ? config.ipAddress : null);
	config.netmask = (!isDhcp ? config.netmask : null);
	config.gateway = (!isDhcp ? config.gateway : null);
	networkService.updateInterface(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const toggleDhcp = (event) => {
	form.querySelector('.ip-address').disabled = event.target.checked;
	form.querySelector('.netmask').disabled = event.target.checked;
	_.each(form.querySelectorAll('.manual'), (element) => { element.classList[event.target.checked ? 'add' : 'remove']('d-none'); });
};

const getBlock = (networkInterface) => {
	let block = null;
	try {
		block = new Netmask(`${networkInterface?.ip4}/${networkInterface?.ip4subnet}`);
	} catch (error) {}
	return block;
};

const render = (event) => {
	const system = networkService.getSystem();
	const block = getBlock(system.networkInterface);
	modal.querySelector('.alert .interface-name').innerHTML = system?.networkInterface?.ifaceName;
	form.querySelector('.name').value = system?.networkInterface?.ifaceName;
	form.querySelector('.dhcp').checked = system?.networkInterface?.dhcp;
	form.querySelector('.ip-address').value = system?.networkInterface?.ip4;
	form.querySelector('.netmask').value = block?.bitmask ?? 'error';
	form.querySelector('.gateway').value = system?.defaultGateway;
	form.querySelector('.cinci').indeterminate = true;
};

const restore = (event) => {
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
	form.querySelector('.dhcp').dispatchEvent(new Event('change'));
};

form.validation = [
	{
		selector: '.ip-address',
		rules: {
			isEmpty: `Can't be empty`,
			isIP: {
				message: `Invalid IP address`,
				version: 4
			}
		}
	},
	{
		selector: '.netmask',
		rules: {
			isEmpty: `Can't be empty`
		}
	},
	{
		selector: '.gateway',
		rules: {
			isEmpty: `Can't be empty`,
			isIP: {
				message: `Invalid IP address`,
				version: 4
			}
		}
	}
];
form.addEventListener('valid', updateInterface);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
form.querySelector('.dhcp').addEventListener('checked-changed', toggleDhcp);