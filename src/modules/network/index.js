import modulePartial from 'modules/network/partials/index.html';
import networkPartial from 'modules/network/partials/network.html';
import * as networkService from 'modules/network/services/network';
import { Netmask } from 'netmask';

const moduleTemplate = _.template(modulePartial);
const networkTemplate = _.template(networkPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#network');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const row = container.querySelector('.row');

const getBlock = (networkInterface) => {
	let block = null;
	try {
		block = new Netmask(`${networkInterface?.ip4}/${networkInterface?.ip4subnet}`);
	} catch (error) {}
	return block;
};

const render = (state) => {
	if (_.isNull(state.system)) {
		return;
	}
	
	const block = getBlock(state.system.networkInterface);
	morphdom(
		row,
		`<div>${networkTemplate({ system: state.system, block })}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

networkService.subscribe([render]);

import('modules/network/identifier_update');
import('modules/network/interface_update');
