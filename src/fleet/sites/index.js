import modulePartial from 'fleet/sites/partials/index.html';
import sitesPartial from 'fleet/sites/partials/sites.html';
import nodePartial from 'fleet/sites/partials/node.html';
import * as nodeService from 'shell/services/node';

const moduleTemplate = _.template(modulePartial);
const sitesTemplate = _.template(sitesPartial);
const nodeTemplate = _.template(nodePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#sites');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');

const render = (state) => {
	if (_.isNull(state.nodes)) {
		return;
	}

	morphdom(
		container,
		`<div>${sitesTemplate({ nodes: state.nodes, nodeTemplate, moment })}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

nodeService.subscribe([render]);
setInterval(() => render({ nodes: nodeService.getNodes() }), 60000);

import('fleet/sites/admin_add');
import('fleet/sites/admin_remove');
import('fleet/sites/node_remove');
