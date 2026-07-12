import sitesPartial from 'fleet/sites/partials/index.html';
import nodePartial from 'fleet/sites/partials/node.html';
import * as nodeService from 'shell/services/node';

const modules = document.querySelector('main .modules');
const sitesTemplate = _.template(sitesPartial);
const nodeTemplate = _.template(nodePartial);

// Mount the sites page once; render() morphs it in place on inventory changes.
modules.insertAdjacentHTML('beforeend', sitesTemplate({ nodes: null, nodeTemplate, moment }));
const sites = modules.querySelector('#sites');

const render = (state) => {
	morphdom(
		sites,
		sitesTemplate({ nodes: state.nodes, nodeTemplate, moment })
	);
};

nodeService.subscribe([render]);
setInterval(() => render({ nodes: nodeService.getNodes() }), 60000);

import('fleet/sites/admin_add');
import('fleet/sites/admin_remove');
import('fleet/sites/node_remove');
