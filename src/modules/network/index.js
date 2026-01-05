import modulePartial from 'modules/network/partials/index.html';
import networkPartial from 'modules/network/partials/network.html';
import * as networkService from 'modules/network/services/network';

const moduleTemplate = _.template(modulePartial);
const networkTemplate = _.template(networkPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#network');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const row = container.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.system)) {
		return;
	}
	
	const networkInterface = _.find(state.system.networkInterfaces, { default: true });
	morphdom(
		row,
		`<div>${networkTemplate({ system: state.system, networkInterface })}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

networkService.subscribe([render]);

import('modules/network/identifier_update');
import('modules/network/interface_update');
