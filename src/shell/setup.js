import page from 'page';
import headerPartial from 'shell/partials/header.html';
import navigationPartial from 'shell/partials/navigation_setup.html';
import mainPartial from 'shell/partials/main.html';
import * as systemService from 'shell/services/system';

let subscription;
const headerTemplate = _.template(headerPartial);
const navigationTemplate = _.template(navigationPartial);
const mainTemplate = _.template(mainPartial);
const header = document.querySelector('header');
const container = document.querySelector('main');

const renderSerialNumber = (state) => {
	if (_.isNull(state.system)) {
		return;
	}

	_.each(document.querySelectorAll('header .serial-number'), (element) => { element.innerHTML = `SN:${state.system.serial || '&mdash;'}`; });
	systemService.unsubscribe(subscription);
	subscription = null;
};

const renderNavigation = () => {
	_.each(header.querySelectorAll('.navbar .nav, .offcanvas .navbar-nav'), (nav) => {
		morphdom(
			nav,
			`<div>${navigationTemplate()}</div>`,
			{ childrenOnly: true }
		);
	});
};

morphdom(
	header,
	headerTemplate({ isUpdating: false })
);
renderNavigation();

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

subscription = systemService.subscribe([renderSerialNumber]);
