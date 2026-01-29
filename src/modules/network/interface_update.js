import interfaceModalPartial from 'modules/network/partials/modals/interface.html';
import * as networkService from 'modules/network/services/network';

document.querySelector('body').insertAdjacentHTML('beforeend', interfaceModalPartial);

const modal = document.querySelector('#network-interface');
const form = modal.closest('u-form');

const updateInterface = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
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

const render = (event) => {
	const system = networkService.getSystem();
	const networkInterface = _.find(system?.networkInterfaces, { default: true });
	modal.querySelector('.alert .interface-name').innerHTML = networkInterface?.ifname;
	form.querySelector('.name').value = networkInterface?.ifname;
	form.querySelector('.dhcp').checked = networkInterface?.dhcp;
	form.querySelector('.ip-address').value = _.find(networkInterface?.addrInfo, { family: 'inet' })?.local;
	form.querySelector('.netmask').value = _.find(networkInterface?.addrInfo, { family: 'inet' })?.prefixlen;
	form.querySelector('.gateway').value = system?.defaultGateway;
};

const restore = (event) => {
	form.reset();
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
form.querySelector('.dhcp').addEventListener('switch-changed', toggleDhcp);