import headerPartial from 'shell/partials/header.html';
import navigationPartial from 'shell/partials/navigation_setup.html';
import mainPartial from 'shell/partials/main.html';
import * as account from 'shell/account';
import * as systemService from 'shell/services/system';
import * as setupService from 'shell/services/setup';

const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const mainTemplate = _.template(mainPartial);
let header = document.querySelector('header');
let container = document.querySelector('main');

const renderSerialNumber = (state) => {
	_.each(document.querySelectorAll('header .serial-number'), (element) => { element.innerHTML = `SN:${state.system.serial || '&mdash;'}`; });
	systemService.unsubscribe();
};

const render = (state) => {
    console.log(state);
    container.innerHTML = 'step 1';
};

morphdom(
	header,
	headerTemplate({ navigationTemplate, isUpgrading: false })
);
_.each(document.querySelectorAll('header .version'), (element) => { element.innerHTML = `v${VERSION}`; });

account.init();

morphdom(
	container,
	mainTemplate()
);

systemService.subscribe([renderSerialNumber]);
setupService.subscribe([render]);
