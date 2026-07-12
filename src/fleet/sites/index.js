import modulePartial from 'fleet/sites/partials/index.html';
import nodePartial from 'fleet/sites/partials/node.html';
import * as nodeService from 'shell/services/node';

const moduleTemplate = _.template(modulePartial);
const nodeTemplate = _.template(nodePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate({ nodes: null, nodeTemplate, moment }));
const module = document.querySelector('#sites');

const render = (state) => {
	morphdom(
		module,
		moduleTemplate({ nodes: state.nodes, nodeTemplate, moment })
	);
};

nodeService.subscribe([render]);
setInterval(() => render({ nodes: nodeService.getNodes() }), 60000);

import('fleet/sites/admin_add');
import('fleet/sites/admin_remove');
import('fleet/sites/node_remove');
