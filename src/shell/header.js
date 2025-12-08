import headerPartial from 'shell/partials/header.html';
import navigationPartial from 'shell/partials/navigation.html';
import * as account from 'shell/account';
import * as notifications from 'shell/notifications';
import * as systemService from 'shell/services/system';
import * as softwareService from 'shell/services/software';
import page from 'page';

let subscription;
const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const container = document.querySelector('header');

const renderSerialNumber = (state) => {
	if (_.isNull(state.system)) {
		return;
	}

	_.each(container.querySelectorAll('.serial-number'), (element) => { element.innerHTML = `SN:${state.system.serial || '&mdash;'}`; });
	systemService.unsubscribe(subscription);
	subscription = null;
};

const renderSystemUpdatesBadge = (state) => {
	if (!state.updates) {
		return;
	}

	const newNav = `<div>${navigationTemplate({ active: page.current, updates: state.updates })}</div>`;
	_.each(container.querySelectorAll('.navbar .nav, .offcanvas .navbar-nav'), (nav) => {
		morphdom(
			nav,
			newNav,
			{ childrenOnly: true }
		);
	});
};

page.start();

morphdom(
	container,
	headerTemplate({ isUpdating: false })
);
renderSystemUpdatesBadge({ updates: [] });

account.init();
notifications.init();

softwareService.subscribeToUpdates([renderSystemUpdatesBadge]);
subscription = systemService.subscribe([renderSerialNumber]);

import('shell/weather');
