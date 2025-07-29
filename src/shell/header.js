import headerPartial from 'shell/partials/header.html';
import navigationPartial from 'shell/partials/navigation.html';
import * as navigation from 'shell/navigation';
import * as account from 'shell/account';
import * as updates from 'shell/updates';
import * as notifications from 'shell/notifications';
import * as systemService from 'shell/services/system';

const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
let container = document.querySelector('header');

const render = (state) => {
	_.each(container.querySelectorAll('.serial-number'), (element) => { element.innerHTML = `SN:${state.system.serial || '&mdash;'}`; });
	systemService.unsubscribe();
};

morphdom(
	container,
	headerTemplate({ navigationTemplate, isUpgrading: false })
);
_.each(container.querySelectorAll('.version'), (element) => { element.innerHTML = `v${VERSION}`; });

account.init();
updates.init();
notifications.init();

systemService.subscribe([render]);

import('shell/weather');
