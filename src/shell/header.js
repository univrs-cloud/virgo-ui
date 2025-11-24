import headerPartial from 'shell/partials/header.html';
import navigationPartial from 'shell/partials/navigation.html';
import * as account from 'shell/account';
import * as updates from 'shell/updates';
import * as notifications from 'shell/notifications';
import * as systemService from 'shell/services/system';

let subscription;
const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const container = document.querySelector('header');

const render = (state) => {
	_.each(container.querySelectorAll('.serial-number'), (element) => { element.innerHTML = `SN:${state.system.serial || '&mdash;'}`; });
	systemService.unsubscribe(subscription);
	subscription = null;
};

morphdom(
	container,
	headerTemplate({ navigationTemplate, isUpdating: false })
);

account.init();
updates.init();
notifications.init();

subscription = systemService.subscribe([render]);

import('shell/weather');
