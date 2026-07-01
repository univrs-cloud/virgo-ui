import headerPartial from 'shell/partials/header.html';
import navigationPartial from 'shell/partials/navigation.html';
import sitesPartial from 'shell/partials/sites.html';
import * as account from 'shell/account';
import * as notifications from 'shell/notifications';
import * as systemService from 'shell/services/system';
import * as softwareService from 'shell/services/software';
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

const renderNavigation = async (state) => {
	if (!state.updates) {
		return;
	}

	const sites = await systemService.getSites();
	const newNav = `<div>${navigationTemplate({ active: page.current, updates: state.updates, sites: sitesTemplate({ sites }) })}</div>`;
	_.each(document.querySelectorAll('header .navbar .nav, .offcanvas .navbar-nav'), (nav) => {
		morphdom(
			nav,
			newNav,
			{ childrenOnly: true }
		);
	});
};

page.start();

morphdom(
	header,
	headerTemplate({ isUpdating: false })
);
renderNavigation({ updates: [] });

account.init();
notifications.init();

softwareService.subscribeToUpdates([renderNavigation]);
unsubscribe = systemService.subscribe([renderSerialNumber]);

import('shell/weather');
