import headerPartial from 'partials/header.html';
import * as updates from 'js/updates';
import * as weather from 'js/weather';
import * as account from 'js/account';
import * as systemService from 'js/services/system';

const headerTemplate = _.template(headerPartial);
let container = document.querySelector('header');

const render = (state) => {
	_.each(container.querySelectorAll('.serial-number'), (element) => { element.innerHTML = `SN:${state.system?.serial || '&mdash;'}`; });
	systemService.unsubscribe();
};

morphdom(
	container,
	headerTemplate()
);
_.each(container.querySelectorAll('.version'), (element) => { element.innerHTML = `v${VERSION}`; });

render({ system: systemService.getSystem() });

systemService.subscribe([render]);

updates.init();
weather.init();
account.init();
