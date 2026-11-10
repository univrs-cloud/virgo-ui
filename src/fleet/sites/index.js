import modulePartial from 'fleet/sites/partials/index.html';
import sitesPartial from 'fleet/sites/partials/sites.html';
import nodePartial from 'fleet/sites/partials/node.html';
import badgesPartial from 'fleet/sites/partials/node_badges.html';
import storagePartial from 'fleet/sites/partials/node_storage.html';
import menuPartial from 'fleet/sites/partials/node_menu.html';
import sitesImage from 'assets/img/empty/sites.svg';
import * as nodeService from 'fleet/sites/services/node';

const moduleTemplate = _.template(modulePartial);
const sitesTemplate = _.template(sitesPartial);
const nodeTemplate = _.template(nodePartial);
const badgesTemplate = _.template(badgesPartial);
const storageTemplate = _.template(storagePartial);
const menuTemplate = _.template(menuPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#sites');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const desktopQuery = window.matchMedia('(min-width: 768px)');

const render = (state) => {
	if (_.isNull(state.nodes)) {
		return;
	}

	morphdom(
		container,
		`<div>${sitesTemplate({ nodes: state.nodes, view: (desktopQuery.matches ? nodeService.getView() : 'cards'), nodeTemplate, badgesTemplate, storageTemplate, menuTemplate, sitesImage, moment, prettyBytes })}</div>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

const switchView = (event) => {
	const button = event.target.closest('button[data-view]');
	if (!button) {
		return;
	}

	nodeService.setView(button.dataset.view);
	render({ nodes: nodeService.getNodes() });
};

nodeService.subscribe([render]);
setInterval(() => render({ nodes: nodeService.getNodes() }), 60000);
module.addEventListener('click', switchView);
desktopQuery.addEventListener('change', () => render({ nodes: nodeService.getNodes() }));

import('fleet/sites/admin_add');
import('fleet/sites/admin_remove');
import('fleet/sites/node_remove');
import('fleet/sites/system_updates');
import('fleet/sites/app_updates');
