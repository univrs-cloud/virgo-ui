import modulePartial from 'modules/network/partials/index.html';
import networkPartial from 'modules/network/partials/network.html';
import gatewayModalPartial from 'modules/network/partials/modals/gateway.html';
import hostModalPartial from 'modules/network/partials/modals/host.html';
import interfaceModalPartial from 'modules/network/partials/modals/interface.html';
import * as networkService from 'modules/network/services/network';
import { Netmask } from 'netmask';

const moduleTemplate = _.template(modulePartial);
const networkTemplate = _.template(networkPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
document.querySelector('body').insertAdjacentHTML('beforeend', gatewayModalPartial);
document.querySelector('body').insertAdjacentHTML('beforeend', hostModalPartial);
document.querySelector('body').insertAdjacentHTML('beforeend', interfaceModalPartial);

let module = document.querySelector('#network');
let gatewayForm = document.querySelector('#network-gateway');
let hostForm = document.querySelector('#network-host');
let interfaceForm = document.querySelector('#network-interface');
let loading = module.querySelector('.loading');
let container = module.querySelector('.container-fluid');

const setGateway = (event) => {
	event.preventDefault();
};

const setHost = (event) => {
	event.preventDefault();
};

const setInterface = (event) => {
	event.preventDefault();
};

const getBlock = (networkInterface) => {
	let block = null;
	try {
		block = new Netmask(`${networkInterface?.ip4}/${networkInterface?.ip4subnet}`);
	} catch (error) {}
	return block;
};

const toggleDhcp = (event) => {
	interfaceForm.querySelector('.ip-address').disabled = event.target.checked;
	interfaceForm.querySelector('.netmask').disabled = event.target.checked;
};

const render = (state) => {
	if (_.isNull(state.system)) {
		return;
	}
	
	const block = getBlock(state.system.networkInterface);
	morphdom(
		container,
		`<div>${networkTemplate({ system: state.system, block })}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

gatewayForm.addEventListener('submit', setGateway);
gatewayForm.addEventListener('show.bs.modal', (event) => {
	let system = networkService.getSystem();
	gatewayForm.querySelector('.gateway').value = system?.defaultGateway;
});
hostForm.addEventListener('submit', setHost);
hostForm.addEventListener('show.bs.modal', (event) => {
	let system = networkService.getSystem();
	hostForm.querySelector('.hostname').value = system?.osInfo?.hostname;
	hostForm.querySelector('.domain-name').value = _.replace(system?.osInfo?.fqdn, `${system?.osInfo?.hostname}.`, '');
});
interfaceForm.addEventListener('submit', setInterface);
interfaceForm.addEventListener('show.bs.modal', (event) => {
	let system = networkService.getSystem();
	const block = getBlock(system.networkInterface);
	interfaceForm.querySelector('.alert .name').innerHTML = system?.networkInterface?.ifaceName;
	interfaceForm.querySelector('input.name').value = system?.networkInterface?.ifaceName;
	interfaceForm.querySelector('.dhcp').checked = system?.networkInterface?.dhcp;
	interfaceForm.querySelector('.ip-address').value = system?.networkInterface?.ip4;
	interfaceForm.querySelector('.netmask').value = block?.bitmask ?? 'error';
});
interfaceForm.querySelector('.dhcp').addEventListener('change', toggleDhcp);

networkService.subscribe([render]);
