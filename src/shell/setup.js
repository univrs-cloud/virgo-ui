import page from 'page';
import headerPartial from 'shell/partials/header.html';
import navigationPartial from 'shell/partials/navigation_setup.html';
import mainPartial from 'shell/partials/main.html';
import * as systemService from 'shell/services/system';

const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const mainTemplate = _.template(mainPartial);
const header = document.querySelector('header');
const container = document.querySelector('main');

const renderSerialNumber = (state) => {
	_.each(document.querySelectorAll('header .serial-number'), (element) => { element.innerHTML = `SN:${state.system.serial || '&mdash;'}`; });
	systemService.unsubscribe();
};

morphdom(
	header,
	headerTemplate({ navigationTemplate, isUpgrading: false })
);

morphdom(
	container,
	mainTemplate()
);

page('*', (ctx) => {
	if (ctx.path !== '/') {
		page.redirect('/');
	}
});
page.start();

systemService.subscribe([renderSerialNumber]);
