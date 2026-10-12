import copy from 'copy-to-clipboard';
import modulePartial from 'node/modules/network/partials/index.html';
import networkPartial from 'node/modules/network/partials/network.html';
import trustedProxyPartial from 'node/modules/network/partials/trusted_proxy.html';
import * as networkService from 'node/modules/network/services/network';

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
	
	const networkInterface = _.find(state.system?.networkInterfaces, { default: true });
	let trustedProxies = _.orderBy(
		state.configuration.trustedProxies || [],
		[(address) => address?.toLowerCase()],
		['asc']
	);
	trustedProxies = _.map(trustedProxies, (trustedProxy) => {
		const jobs = _.filter(state?.jobs, (job) => { return _.startsWith(job?.name, 'trustedProxy') && job.data?.config?.address === trustedProxy; });
		return trustedProxyTemplate({ trustedProxy, jobs });
	});
	morphdom(
		row,
		`<div>${networkTemplate({
			system: state.system,
			networkInterface,
			trustedProxies,
			firewall: state.firewall,
			unbanJobs: _.filter(state?.jobs, (job) => { return _.startsWith(job?.name, 'host:firewall:unban'); }),
			peerVirtualIp: _.find(state.discovery, (peer) => { return Boolean(peer?.virtualIp); }) || null,
			moment
		})}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

const copyToClipboard = (event) => {
	if (event.target.closest('a')?.dataset.action !== 'copy-to-clipboard') {
		return;
	}

	event.preventDefault();
	const button = event.target.closest('a');
	const text = button.nextElementSibling.textContent;
	if (copy(text)) {
		const tooltip = bootstrap.Tooltip.getInstance(button);
		const originalTitle = button.dataset.bsOriginalTitle;
		tooltip.setContent({ '.tooltip-inner': 'Copied!' });
		setTimeout(() => {
			tooltip.hide();
			tooltip.setContent({ '.tooltip-inner': originalTitle });
		}, 1000);
	}
};

const syncFirewall = (event) => {
	if (event.target.closest('a')?.dataset.action !== 'sync-firewall') {
		return;
	}

	event.preventDefault();
	networkService.syncFirewall();
};

module.addEventListener('click', copyToClipboard);
module.addEventListener('click', syncFirewall);

networkService.subscribe([render]);

import('node/modules/network/identifier_update');
import('node/modules/network/interface_update');
import('node/modules/network/trusted_proxy_add');
import('node/modules/network/trusted_proxy_update');
import('node/modules/network/trusted_proxy_delete');
import('node/modules/network/unban');
