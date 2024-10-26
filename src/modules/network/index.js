import modulePartial from 'modules/network/partials/index.html';
import networkPartial from 'modules/network/partials/network.html';
import gatewayModalPartial from 'modules/network/partials/modals/gateway.html';
import hostModalPartial from 'modules/network/partials/modals/host.html';
import interfaceModalPartial from 'modules/network/partials/modals/interface.html';
import * as networkService from 'modules/network/services/network';
import * as tldts from 'tldts';

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

const toggleDhcp = (event) => {
	interfaceForm.querySelector('.ip-address').disabled = event.target.checked;
	interfaceForm.querySelector('.subnet-mask').disabled = event.target.checked;
};

const render = (state) => {
	if (_.isNull(state.system)) {
		return;
	}

	loading.classList.add('d-none');
	
	morphdom(
		container,
		`<div>${networkTemplate({ system: state.system, tldts })}</div>`,
		{ childrenOnly: true }
	);
	gatewayForm.querySelector('.gateway').value = state.system.defaultGateway;
	hostForm.querySelector('.hostname').value = tldts.getSubdomain(state.system.osInfo.fqdn, { extractHostname: false });
	hostForm.querySelector('.domain-name').value = tldts.getDomain(state.system.osInfo.fqdn, { extractHostname: false });
	interfaceForm.querySelector('.name').value = state.system.networkInterface.ifaceName;
	interfaceForm.querySelector('.dhcp').checked = state.system.networkInterface.dhcp;
	interfaceForm.querySelector('.ip-address').value = state.system.networkInterface.ip4;
	interfaceForm.querySelector('.subnet-mask').value = state.system.networkInterface.ip4subnet;
};

render({ system: networkService.getSystem() });

networkService.subscribe([render]);

gatewayForm.addEventListener('submit', setGateway);
hostForm.addEventListener('submit', setHost);
interfaceForm.addEventListener('submit', setInterface);
interfaceForm.querySelector('.dhcp').addEventListener('change', toggleDhcp);