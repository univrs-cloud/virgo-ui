import headerPartial from 'shell/partials/header.html';
import navigationPartial from 'shell/partials/navigation.html';
import * as account from 'shell/account';
import * as notifications from 'shell/notifications';
import * as systemService from 'shell/services/system';
import * as softwareService from 'shell/services/software';

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
	_.each(container.querySelectorAll('.navbar .nav, .offcanvas .navbar-nav'), (nav) => {
		morphdom(
			nav,
			`<div>${navigationTemplate({ updates: state.updates })}</div>`,
			{ childrenOnly: true }
		);
	});
};

morphdom(
	container,
	headerTemplate({ navigationTemplate, isUpdating: false })
);

account.init();
notifications.init();

subscription = systemService.subscribe([renderSerialNumber]);
softwareService.subscribeToUpdates([renderSystemUpdatesBadge]);

import('shell/weather');
