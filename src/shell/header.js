import headerPartial from 'shell/partials/header.html';
import navigationPartial from 'shell/partials/navigation.html';
import sitesPartial from 'shell/partials/sites.html';
import * as account from 'shell/account';
import * as notifications from 'shell/notifications';
import * as sitesService from 'shell/services/sites';
import * as systemService from 'shell/services/system';
import * as softwareService from 'shell/services/software';
import * as nodeService from 'shell/services/node';
import * as runtimeService from 'shell/services/runtime';
import page from 'page';

let unsubscribe;
const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const sitesTemplate = _.template(sitesPartial);
const header = document.querySelector('header');

const renderSerialNumber = (state) => {
	if (_.isNull(state.system)) {
		return;
	}

	_.each(header.querySelectorAll('.serial-number'), (element) => { element.innerHTML = `SN:${state.system.serial || '&mdash;'}`; });
	unsubscribe?.();
	unsubscribe = null;
};

const bindSiteSelection = () => {
	_.each(document.querySelectorAll('header [data-node-id], .offcanvas [data-node-id]'), (element) => {
		element.addEventListener('click', (event) => {
			event.preventDefault();
			const nodeId = element.dataset.nodeId;
			if (!nodeId || nodeId === runtimeService.getSelectedNodeId()) {
				return;
			}
			runtimeService.setSelectedNodeId(nodeId);
			location.reload();
		});
	});
};

const renderNavigation = async (state) => {
	if (!state.updates && !isFleetMode) {
		return;
	}

	let hasSites = true;
	let sites = '';
	if (isFleetMode && isAuthenticated) {
		const siteList = await sitesService.getSites();
		hasSites = siteList.length > 0;
		sites = sitesTemplate({ sites: siteList });
	}

	const newNav = `<div>${navigationTemplate({ active: page.current, updates: state.updates || [], sites, hasSites })}</div>`;
	_.each(document.querySelectorAll('header .navbar .nav, .offcanvas .navbar-nav'), (nav) => {
		morphdom(
			nav,
			newNav,
			{ childrenOnly: true }
		);
	});
	bindSiteSelection();
};

page.start();

morphdom(
	header,
	headerTemplate({ isUpdating: false })
);
account.render();
renderNavigation({ updates: [] });

notifications.init();

softwareService.subscribeToUpdates([renderNavigation]);
if (isFleetMode) {
	nodeService.subscribe([() => {
		renderNavigation({ updates: softwareService.getUpdates() || [] });
	}]);
}
if (isAdmin) {
	unsubscribe = systemService.subscribe([renderSerialNumber]);
}

import('shell/weather');
