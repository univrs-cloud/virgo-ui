import modulePartial from 'modules/network/partials/index.html';
import networkPartial from 'modules/network/partials/network.html';
import trustedProxyPartial from 'modules/network/partials/trusted_proxy.html';
import * as networkService from 'modules/network/services/network';

const moduleTemplate = _.template(modulePartial);
const trustedProxyTemplate = _.template(trustedProxyPartial);
const networkTemplate = _.template(networkPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#network');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const row = container.querySelector('.row');

const render = (state) => {
	if (_.isNull(state.system) || _.isNull(state.configuration)) {
		return;
	}
	
	const networkInterface = _.find(state.system.networkInterfaces, { default: true });
	const trustedProxies = _.map(state.configuration.trustedProxies, (trustedProxy) => {
		const jobs = _.filter(state.jobs, (job) => { return job.name.startsWith('trustedProxy') && job.data?.config?.address === trustedProxy; });
		return trustedProxyTemplate({ trustedProxy, jobs });
	});
	morphdom(
		row,
		`<div>${networkTemplate({ system: state.system, networkInterface, trustedProxies })}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

networkService.subscribe([render]);

import('modules/network/identifier_update');
import('modules/network/interface_update');
import('modules/network/trusted_proxy_add');
import('modules/network/trusted_proxy_update');
import('modules/network/trusted_proxy_delete');
