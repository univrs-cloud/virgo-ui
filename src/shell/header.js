import headerPartial from 'shell/partials/header.html';
import * as navigation from 'shell/navigation';
import * as jobs from 'shell/jobs';
import * as account from 'shell/account';
import * as updates from 'shell/updates';
import * as notifications from 'shell/notifications';
import * as weather from 'shell/weather';
import * as systemService from 'shell/services/system';

const headerTemplate = _.template(headerPartial);
let container = document.querySelector('header');

const render = (state) => {
	_.each(container.querySelectorAll('.serial-number'), (element) => { element.innerHTML = `SN:${state.system?.serial || '&mdash;'}`; });
	systemService.unsubscribe();
};

morphdom(
	container,
	headerTemplate({ navigationTemplate: navigation.template, isUpgrading: false })
);
_.each(container.querySelectorAll('.version'), (element) => { element.innerHTML = `v${VERSION}`; });

render({ system: systemService.getSystem() });

systemService.subscribe([render]);

jobs.init();
account.init();
updates.init();
notifications.init();
weather.init();
